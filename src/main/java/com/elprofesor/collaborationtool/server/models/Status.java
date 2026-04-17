package com.elprofesor.collaborationtool.server.models;

public enum Status {
    TO_DO("A Faire"),
    NOT_FINISH("En cours"),
    END("Terminé");

    private final String label;

    Status(String label){
        this.label = label;
    }
    public String getLabel() {
        return label;
    }
}
