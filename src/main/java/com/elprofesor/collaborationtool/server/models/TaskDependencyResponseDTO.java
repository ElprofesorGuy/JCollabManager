package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;
import lombok.Data;

import java.util.Objects;
import java.util.UUID;

@Builder
@Data
public class TaskDependencyResponseDTO {

    private UUID dependencyId;
    private UUID projectId;
    private UUID predecessorId;
    private UUID successorId;
    private String predecessorTitle;
    private String successorTitle;
    private String projectName;


}
