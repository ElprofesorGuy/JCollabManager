package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Builder
@Data
public class TaskResponseDTO {
    private UUID id;
    private String projectName;
    private String title;
    private String description;
    private Status status;
    private String assign_to;
}
