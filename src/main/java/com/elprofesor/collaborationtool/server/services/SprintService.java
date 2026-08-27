package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.models.SprintRequestDTO;
import com.elprofesor.collaborationtool.server.models.SprintResponseDTO;

import java.util.List;
import java.util.UUID;

public interface SprintService {
    SprintResponseDTO createSprint(UUID projectId, SprintRequestDTO sprintRequestDTO);
    SprintResponseDTO updateSprint(UUID sprintId, SprintRequestDTO sprintRequestDTO);
    void deleteSprint(UUID sprintId);
    List<SprintResponseDTO> getSprintsByProject(UUID projectId);
    SprintResponseDTO startSprint(UUID sprintId);
    SprintResponseDTO completeSprint(UUID sprintId);
}
