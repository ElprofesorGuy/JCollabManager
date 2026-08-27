package com.elprofesor.collaborationtool.server.models;

public enum SystemRole {
    ADMIN ("Admin"),
    MEMBER("User");

    private final String role;

    SystemRole(String role){
        this.role = role;
    }
    public String getRole() {
        return this.role;
    }
}
