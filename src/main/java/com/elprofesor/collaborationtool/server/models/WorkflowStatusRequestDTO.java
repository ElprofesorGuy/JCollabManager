package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WorkflowStatusRequestDTO {
    private String name;
    private int orderIndex;
    private boolean completed;
}
