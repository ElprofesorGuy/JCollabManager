package com.elprofesor.collaborationtool.server.models;

public enum Role {
    ADMIN ("ROLE_ADMIN"),
    MEMBER ("ROLE_MEMBRE");

    private final String role;

    Role(String role){
        this.role = role;
    }
    public String getRole() {
        return this.role;
    }
}
