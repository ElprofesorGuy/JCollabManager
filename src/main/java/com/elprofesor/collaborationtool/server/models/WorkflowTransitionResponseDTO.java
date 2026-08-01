package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class WorkflowTransitionResponseDTO {
    private UUID id;
    private UUID projectId;
    private UUID fromStatusId;
    private String fromStatusName;
    private UUID toStatusId;
    private String toStatusName;
    private String name;
    private ProjectRole requiredRole;
}
