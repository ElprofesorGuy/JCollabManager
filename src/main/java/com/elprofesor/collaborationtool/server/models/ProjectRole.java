package com.elprofesor.collaborationtool.server.models;

public enum ProjectRole {
    CONTRIBUTOR("Contributeur"),
    MANAGER("Manager"),
    REVIEWER("Reviewer"),
    VIEWER("Viewer");

    private final String projectRole;

    ProjectRole (String role){this.projectRole = role;}

    public String getProjectRole() {
        return projectRole;
    }
}
