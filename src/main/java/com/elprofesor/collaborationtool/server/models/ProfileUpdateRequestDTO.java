package com.elprofesor.collaborationtool.server.models;

import lombok.Data;

@Data
public class ProfileUpdateRequestDTO {
    private String username;
    private String currentPassword;
    private String newPassword;
}
