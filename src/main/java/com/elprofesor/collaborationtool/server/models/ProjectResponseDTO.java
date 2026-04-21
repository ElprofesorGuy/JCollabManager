package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Builder
@Data
public class ProjectResponseDTO {
    private UUID id;
    private String title;
    private String description;
    private String ownerEmail;
}
