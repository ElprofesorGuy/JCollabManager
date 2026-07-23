package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.models.WorkflowStatusRequestDTO;
import com.elprofesor.collaborationtool.server.models.WorkflowStatusResponseDTO;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkflowStatusService {
    WorkflowStatusResponseDTO addWorkflowStatus(WorkflowStatusRequestDTO workflowStatusRequestDTO, UUID projectId);
    List<WorkflowStatusResponseDTO> getWorkflowStatusOfProject(UUID projectId);
    Optional<WorkflowStatusResponseDTO> modifyWorkflowStatusOfProject(UUID id, WorkflowStatusRequestDTO requestDTO);
    boolean deleteStatus(UUID workflowStatusId);

}
