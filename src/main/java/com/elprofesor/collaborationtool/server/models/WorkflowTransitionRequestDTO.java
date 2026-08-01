package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class WorkflowTransitionRequestDTO {
    private UUID fromStatusId;
    private UUID toStatusId;
    private String name;
    private ProjectRole requiredRole;
}
