package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.util.UUID;
import java.util.Set;

@Builder
@Data
public class TaskResponseDTO {
    private UUID id;
    private UUID projectId;
    private String projectName;
    private String title;
    private String description;
    private String assignTo;
    private String attachmentUrl;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate dateEcheance;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate dateDebut;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate submissionDate;
    private String taskType;
    private String parentTaskName;
    private String workflowStatus;
    private Boolean isCompleted;
    private Set<TaskDependencyResponseDTO> predecessorDependencies;
    private Set<TaskDependencyResponseDTO> successorDependencies;
    private Set<TaskResponseDTO> subtasks;
    
    private UUID sprintId;
    private Integer storyPoints;
}
