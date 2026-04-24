package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;

import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;


@Builder
public class TaskRequestDTO {
    private String projectName;
    private String title;
    private String description;
    private Status status;
    private String assign_to;


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

    @Override
    public final boolean equals(Object o) {
        if (!(o instanceof TaskRequestDTO that)) return false;

        return Objects.equals(projectName, that.projectName) && Objects.equals(getTitle(), that.getTitle()) && Objects.equals(getDescription(), that.getDescription()) && getStatus() == that.getStatus() && Objects.equals(getAssign_to(), that.getAssign_to());
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(projectName);
        result = 31 * result + Objects.hashCode(getTitle());
        result = 31 * result + Objects.hashCode(getDescription());
        result = 31 * result + Objects.hashCode(getStatus());
        result = 31 * result + Objects.hashCode(getAssign_to());
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
                '}';
    }
}
