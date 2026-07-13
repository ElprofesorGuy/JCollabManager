package com.elprofesor.collaborationtool.server.models;

public enum Role {
    ADMIN ("Admin"),
    CONTRIBUTOR ("Contributor"),
    REVIEWER("Reviewer"),
    VIEWER("Viewer");

    private final String role;

    Role(String role){
        this.role = role;
    }
    public String getRole() {
        return this.role;
    }
}
