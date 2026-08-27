package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class WorkflowStatusResponseDTO {
    private UUID id;
    private String name;
    private boolean completed;
    private int orderIndex;
}
