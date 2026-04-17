package com.elprofesor.collaborationtool.server.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Builder
@AllArgsConstructor
@Getter
@Setter
public class AuthResponseDTO {
    private String token;
    private UserResponseDTO user;
}
