package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;

import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;


@Builder
public class ProjectRequestDTO {
    //private UUID id;
    private String title;
    private String description;
    //private LocalDate creation_date;
    //private UUID owner_id;
    private String ownerEmail;
    /*public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }*/


    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    /*public LocalDate getCreation_date() {
        return creation_date;
    }

    public void setCreation_date(LocalDate creation_date) {
        this.creation_date = creation_date;
    }*/

    /*public UUID getOwner_id() {
        return owner_id;
    }

    public void setOwner_id(UUID owner_id) {
        this.owner_id = owner_id;
    }*/

    @Override
    public final boolean equals(Object o) {
        if (!(o instanceof ProjectRequestDTO that)) return false;

        return Objects.equals(getTitle(), that.getTitle()) && Objects.equals(getDescription(), that.getDescription()) && Objects.equals(getOwnerEmail(), that.getOwnerEmail());
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(getTitle());
        result = 31 * result + Objects.hashCode(getDescription());
        result = 31 * result + Objects.hashCode(getOwnerEmail());
        return result;
    }

    @Override
    public String toString() {
        return "ProjectRequestDTO{" +
                "title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", ownerEmail='" + ownerEmail + '\'' +
                '}';
    }
}
