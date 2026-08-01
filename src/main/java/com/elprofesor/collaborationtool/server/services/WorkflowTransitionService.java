package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.entities.WorkflowStatus;
import com.elprofesor.collaborationtool.server.models.WorkflowTransitionRequestDTO;
import com.elprofesor.collaborationtool.server.models.WorkflowTransitionResponseDTO;

import java.util.List;
import java.util.UUID;

public interface WorkflowTransitionService {
    WorkflowTransitionResponseDTO addTransition(UUID projectId, WorkflowTransitionRequestDTO dto);
    WorkflowTransitionResponseDTO updateTransition(UUID projectId, UUID transitionId, WorkflowTransitionRequestDTO dto);
    List<WorkflowTransitionResponseDTO> listTransitions(UUID projectId);
    List<WorkflowTransitionResponseDTO> listAllowedTransitions(UUID projectId, UUID fromStatusId);
    //List<WorkflowTransitionResponseDTO> initializeDefaultTransitions(UUID projectId);
    void deleteTransition(UUID projectId, UUID transitionId);
    void validateTransition(Task task, WorkflowStatus targetStatus);
}
