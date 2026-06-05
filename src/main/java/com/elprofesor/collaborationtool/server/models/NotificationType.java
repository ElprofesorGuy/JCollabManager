package com.elprofesor.collaborationtool.server.models;

public enum NotificationType {
    NOUVELLE_TACHE("Nouvelle tâche"),
    COMMENTAIRE_AJOUTE("Commentaire ajouté"),
    PROJET_MODIFIE ("Projet modifié"),
    RAPPEL_ECHEANCE ("Rappel de la date d'échéance");


    private String type;

    NotificationType(String type){
        this.type = type;
    }

    public String getType() {
        return type;
    }

}
