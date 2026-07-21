package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.mapper.WorkflowStatusMapper;
import com.elprofesor.collaborationtool.server.models.WorkflowStatusRequestDTO;
import com.elprofesor.collaborationtool.server.models.WorkflowStatusResponseDTO;
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

    @Override
    public WorkflowStatusResponseDTO addWorkflowStatus(WorkflowStatusRequestDTO workflowStatusRequestDTO) {
         return mapper.workflowStatusToDto(workflowStatusRepository.save(mapper.workflowStatusRequestDtoToWorkflowStatus(workflowStatusRequestDTO)));
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
                    workflowStatus.setName(requestDTO.getName());
                    return workflowStatusRepository.save(workflowStatus);
                })
                .map(mapper::workflowStatusToDto);
    }
}
