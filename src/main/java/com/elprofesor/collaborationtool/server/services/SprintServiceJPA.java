package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.entities.Sprint;
import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.mapper.SprintMapper;
import com.elprofesor.collaborationtool.server.models.SprintRequestDTO;
import com.elprofesor.collaborationtool.server.models.SprintResponseDTO;
import com.elprofesor.collaborationtool.server.models.SprintStatus;
import com.elprofesor.collaborationtool.server.repositories.ProjectRepository;
import com.elprofesor.collaborationtool.server.repositories.SprintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SprintServiceJPA implements SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final SprintMapper sprintMapper;

    @Override
    public SprintResponseDTO createSprint(UUID projectId, SprintRequestDTO sprintRequestDTO) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found with id: " + projectId));

        Sprint sprint = sprintMapper.sprintRequestDTOToSprint(sprintRequestDTO);
        sprint.setProject(project);
        sprint.setStatus(SprintStatus.PLANNED);

        Sprint savedSprint = sprintRepository.save(sprint);
        return sprintMapper.sprintToSprintResponseDTO(savedSprint);
    }

    @Override
    public SprintResponseDTO updateSprint(UUID sprintId, SprintRequestDTO sprintRequestDTO) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new NotFoundException("Sprint not found with id: " + sprintId));

        sprint.setName(sprintRequestDTO.getName());
        sprint.setGoal(sprintRequestDTO.getGoal());
        sprint.setStartDate(sprintRequestDTO.getStartDate());
        sprint.setEndDate(sprintRequestDTO.getEndDate());

        Sprint updatedSprint = sprintRepository.save(sprint);
        return sprintMapper.sprintToSprintResponseDTO(updatedSprint);
    }

    @Override
    public void deleteSprint(UUID sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new NotFoundException("Sprint not found with id: " + sprintId));
        sprintRepository.delete(sprint);
    }

    @Override
    public List<SprintResponseDTO> getSprintsByProject(UUID projectId) {
        return sprintRepository.findByProjectId(projectId).stream()
                .map(sprintMapper::sprintToSprintResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public SprintResponseDTO startSprint(UUID sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new NotFoundException("Sprint not found with id: " + sprintId));

        // Optionally, ensure no other sprint is active for the same project
        List<Sprint> projectSprints = sprintRepository.findByProjectId(sprint.getProject().getId());
        for (Sprint s : projectSprints) {
            if (s.getStatus() == SprintStatus.ACTIVE && !s.getId().equals(sprintId)) {
                throw new IllegalStateException("Another sprint is already active in this project.");
            }
        }

        sprint.setStatus(SprintStatus.ACTIVE);
        Sprint updatedSprint = sprintRepository.save(sprint);
        return sprintMapper.sprintToSprintResponseDTO(updatedSprint);
    }

    @Override
    public SprintResponseDTO completeSprint(UUID sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new NotFoundException("Sprint not found with id: " + sprintId));

        sprint.setStatus(SprintStatus.COMPLETED);
        Sprint updatedSprint = sprintRepository.save(sprint);
        return sprintMapper.sprintToSprintResponseDTO(updatedSprint);
    }
}
