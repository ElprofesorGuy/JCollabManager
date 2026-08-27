package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;


@Builder
public class TaskRequestDTO {
    private String title;
    private String description;
    private String assignTo;
    private String attachmentUrl;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate dateEcheance;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate dateDebut;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private String workflowStatus;
    private String taskType;
    private String parentTaskName;
    private UUID sprintId;
    private Integer storyPoints;

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

    public String getAssignTo() {
        return assignTo;
    }

    public void setAssignTo(String assignTo) {
        this.assignTo = assignTo;
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

    public LocalDate getDateDebut() {
        return dateDebut;
    }

    public void setDateDebut(LocalDate dateDebut) {
        this.dateDebut = dateDebut;
    }

    public String getWorkflowStatus() {
        return workflowStatus;
    }

    public void setWorkflowStatus(String workflowStatus) {
        this.workflowStatus = workflowStatus;
    }

    public String getTaskType() {
        return taskType;
    }

    public void setTaskType(String taskType) {
        this.taskType = taskType;
    }

    public String getParentTaskName() {
        return parentTaskName;
    }

    public void setParentTaskName(String parentTaskName) {
        this.parentTaskName = parentTaskName;
    }

    public UUID getSprintId() {
        return sprintId;
    }

    public void setSprintId(UUID sprintId) {
        this.sprintId = sprintId;
    }

    public Integer getStoryPoints() {
        return storyPoints;
    }

    public void setStoryPoints(Integer storyPoints) {
        this.storyPoints = storyPoints;
    }

    @Override
    public final boolean equals(Object o) {
        if (!(o instanceof TaskRequestDTO that)) return false;

        return Objects.equals(getTitle(), that.getTitle()) && Objects.equals(getDescription(), that.getDescription()) && Objects.equals(getAssignTo(), that.getAssignTo()) && Objects.equals(getAttachmentUrl(), that.getAttachmentUrl()) && Objects.equals(getDateEcheance(), that.getDateEcheance()) && Objects.equals(getDateDebut(), that.getDateDebut()) && Objects.equals(getWorkflowStatus(), that.getWorkflowStatus()) && Objects.equals(getTaskType(), that.getTaskType()) && Objects.equals(getParentTaskName(), that.getParentTaskName()) && Objects.equals(getSprintId(), that.getSprintId()) && Objects.equals(getStoryPoints(), that.getStoryPoints());
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(getTitle());
        result = 31 * result + Objects.hashCode(getDescription());
        result = 31 * result + Objects.hashCode(getAssignTo());
        result = 31 * result + Objects.hashCode(getAttachmentUrl());
        result = 31 * result + Objects.hashCode(getDateEcheance());
        result = 31 * result + Objects.hashCode(getDateDebut());
        result = 31 * result + Objects.hashCode(getWorkflowStatus());
        result = 31 * result + Objects.hashCode(getTaskType());
        result = 31 * result + Objects.hashCode(getParentTaskName());
        result = 31 * result + Objects.hashCode(getSprintId());
        result = 31 * result + Objects.hashCode(getStoryPoints());
        return result;
    }

    @Override
    public String toString() {
        return "TaskRequestDTO{" +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", assignTo='" + assignTo + '\'' +
                ", attachmentUrl='" + attachmentUrl + '\'' +
                ", dateEcheance=" + dateEcheance +
                ", dateDebut=" + dateDebut +
                ", workflowStatus='" + workflowStatus + '\'' +
                ", taskType='" + taskType + '\'' +
                ", parentTaskName='" + parentTaskName + '\'' +
                ", sprintId=" + sprintId +
                ", storyPoints=" + storyPoints +
                '}';
    }
}
