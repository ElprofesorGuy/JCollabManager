package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;

import java.time.LocalDate;
import java.util.Objects;


@Builder
public class TaskRequestDTO {
    private String projectName;
    private String title;
    private String description;
    private Status status;
    private String assign_to;
    private String attachmentUrl;
    private LocalDate dateEcheance;


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

    public String getAssign_to() {
        return assign_to;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public void setAssign_to(String assign_to) {
        this.assign_to = assign_to;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public LocalDate getDateEcheance() {
        return dateEcheance;
    }

    public void setDateEcheance(LocalDate dateEcheance) {
        this.dateEcheance = dateEcheance;
    }


    @Override
    public final boolean equals(Object o) {
        if (!(o instanceof TaskRequestDTO that)) return false;

        return Objects.equals(getProjectName(), that.getProjectName()) && Objects.equals(getTitle(), that.getTitle()) && Objects.equals(getDescription(), that.getDescription()) && getStatus() == that.getStatus() && Objects.equals(getAssign_to(), that.getAssign_to()) && Objects.equals(getAttachmentUrl(), that.getAttachmentUrl()) && Objects.equals(getDateEcheance(), that.getDateEcheance());
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(getProjectName());
        result = 31 * result + Objects.hashCode(getTitle());
        result = 31 * result + Objects.hashCode(getDescription());
        result = 31 * result + Objects.hashCode(getStatus());
        result = 31 * result + Objects.hashCode(getAssign_to());
        result = 31 * result + Objects.hashCode(getAttachmentUrl());
        result = 31 * result + Objects.hashCode(getDateEcheance());
        return result;
    }

    @Override
    public String toString() {
        return "TaskRequestDTO{" +
                "projectName='" + projectName + '\'' +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", status=" + status +
                ", assign_to='" + assign_to + '\'' +
                ", attachmentUrl='" + attachmentUrl + '\'' +
                ", date_echeance=" + dateEcheance +
                '}';
    }
}
