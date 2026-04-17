package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;

import java.time.LocalDate;
import java.util.UUID;


@Builder
public class TaskDTO {
    private UUID id;
    private UUID project_id;
    private String title;
    private String description;
    private Status status;
    private UserResponseDTO assign_to;
    private LocalDate creation_date;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProject_id() {
        return project_id;
    }

    public void setProject_id(UUID project_id) {
        this.project_id = project_id;
    }

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

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public UserResponseDTO getAssign_to() {
        return assign_to;
    }

    public void setAssign_to(UserResponseDTO assign_to) {
        this.assign_to = assign_to;
    }

    public LocalDate getCreation_date() {
        return creation_date;
    }

    public void setCreation_date(LocalDate creation_date) {
        this.creation_date = creation_date;
    }

    @Override
    public final boolean equals(Object o) {
        if (!(o instanceof TaskDTO taskDTO)) return false;

        return getId().equals(taskDTO.getId()) && getProject_id().equals(taskDTO.getProject_id()) && getTitle().equals(taskDTO.getTitle()) && getDescription().equals(taskDTO.getDescription()) && getStatus().equals(taskDTO.getStatus()) && getAssign_to().equals(taskDTO.getAssign_to()) && getCreation_date().equals(taskDTO.getCreation_date());
    }

    @Override
    public int hashCode() {
        int result = getId().hashCode();
        result = 31 * result + getProject_id().hashCode();
        result = 31 * result + getTitle().hashCode();
        result = 31 * result + getDescription().hashCode();
        result = 31 * result + getStatus().hashCode();
        result = 31 * result + getAssign_to().hashCode();
        result = 31 * result + getCreation_date().hashCode();
        return result;
    }

    @Override
    public String toString() {
        return "TaskDTO{" +
                "id=" + id +
                ", project_id=" + project_id +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", status='" + status + '\'' +
                ", assign_to='" + assign_to + '\'' +
                ", creation_date=" + creation_date +
                '}';
    }
}
