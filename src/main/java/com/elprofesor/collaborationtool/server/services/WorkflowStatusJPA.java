package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.entities.WorkflowStatus;
import com.elprofesor.collaborationtool.server.mapper.WorkflowStatusMapper;
import com.elprofesor.collaborationtool.server.models.WorkflowStatusRequestDTO;
import com.elprofesor.collaborationtool.server.models.WorkflowStatusResponseDTO;
import com.elprofesor.collaborationtool.server.repositories.ProjectRepository;
import com.elprofesor.collaborationtool.server.repositories.WorkflowStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowStatusJPA implements WorkflowStatusService{

    private final WorkflowStatusRepository workflowStatusRepository;
    private final WorkflowStatusMapper mapper;
    private final ProjectRepository projectRepository;

    @Override
    public WorkflowStatusResponseDTO addWorkflowStatus(WorkflowStatusRequestDTO workflowStatusRequestDTO, UUID projecttId) {
        int count = workflowStatusRepository.findByProject_Id(projecttId).size();
        Project associatedProject = projectRepository.findById(projecttId)
                .orElseThrow(()-> new NotFoundException("Projet inexistant"));
        WorkflowStatus newStatus = WorkflowStatus.builder()
                .orderIndex(workflowStatusRequestDTO.getOrderIndex() > 0 ? workflowStatusRequestDTO.getOrderIndex() : count)
                .name(workflowStatusRequestDTO.getName())
                .completed(workflowStatusRequestDTO.isCompleted())
                .project(associatedProject)
                .build();
        System.out.println("Nombre de status déjà présent : " + count);
         return mapper.workflowStatusToDto(workflowStatusRepository.save(newStatus));
    }

    @Override
    public List<WorkflowStatusResponseDTO> getWorkflowStatusOfProject(UUID projectId) {
        return workflowStatusRepository.findByProjectIdOrderByOrderIndexAsc(projectId)
                .stream()
                .map(mapper::workflowStatusToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<WorkflowStatusResponseDTO> modifyWorkflowStatusOfProject(UUID id, WorkflowStatusRequestDTO requestDTO) {
        return workflowStatusRepository.findById(id)
                .map(workflowStatus -> {
                    if (requestDTO.getName() != null) workflowStatus.setName(requestDTO.getName());
                    workflowStatus.setOrderIndex(requestDTO.getOrderIndex());
                    workflowStatus.setCompleted(requestDTO.isCompleted());
                    return workflowStatusRepository.save(workflowStatus);
                })
                .map(mapper::workflowStatusToDto);
    }

    @Override
    public void deleteStatus(UUID workflowStatusid) {
        // Fetch the status before deleting it
        WorkflowStatus status = workflowStatusRepository.findById(workflowStatusid)
                .orElseThrow(()-> new NotFoundException("Status inexistant"));
        
        UUID projectId = status.getProject().getId();
        boolean wasCompleted = status.getCompleted();
        int deletedOrderIndex = status.getOrderIndex();

        workflowStatusRepository.deleteById(workflowStatusid);

        // Fetch remaining statuses for this specific project, ordered by index
        List<WorkflowStatus> remainingStatuses = workflowStatusRepository.findByProjectIdOrderByOrderIndexAsc(projectId);
        
        if (remainingStatuses.isEmpty()) {
            return;
        }

        if (wasCompleted) {
            // Transfer completed flag to the new last status
            WorkflowStatus lastStatus = remainingStatuses.get(remainingStatuses.size() - 1);
            lastStatus.setCompleted(true);
            workflowStatusRepository.save(lastStatus);
        } else {
            // Decrement order index for statuses that were after the deleted one
            remainingStatuses.stream()
                    .filter(s -> s.getOrderIndex() > deletedOrderIndex)
                    .forEach(s -> {
                        s.setOrderIndex(s.getOrderIndex() - 1);
                        workflowStatusRepository.save(s);
                    });
        }
    }
}
