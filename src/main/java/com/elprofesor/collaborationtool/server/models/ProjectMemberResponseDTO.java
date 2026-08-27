package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ProjectMemberResponseDTO {
    private UUID id;
    private String username;
    private String email;
    private ProjectRole projectRole;
}
