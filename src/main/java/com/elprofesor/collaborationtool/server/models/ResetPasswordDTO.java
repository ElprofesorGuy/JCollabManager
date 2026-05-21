package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResetPasswordDTO {
    private String token;
    private String newPassword;
}
