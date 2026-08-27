package com.elprofesor.collaborationtool.server.entities;



import com.elprofesor.collaborationtool.server.models.TaskType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Task {
    @Id
    @GeneratedValue(generator = "UUID")
    @UuidGenerator
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(length = 150)
    @Size(max = 150)
    private String title;

    @NotNull
    private String description;
    
    @Column(name = "attachment_url")
    private String attachmentUrl;


    @Column(name = "date_echeance")
    private LocalDate dateEcheance;

    @CreationTimestamp
    private LocalDate creation_date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", columnDefinition = "uuid")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assign_to", columnDefinition = "uuid")
    private Users assignTo;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    @OneToMany(mappedBy = "predecessor", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TaskDependency> predecessorDependencies;

    @OneToMany(mappedBy = "successor", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TaskDependency> successorDependencies;

    @Column(name = "submission_date")
    private LocalDate submissionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_task_id", columnDefinition = "uuid")
    private Task parentTask;

    @OneToMany(mappedBy = "parentTask")
    private Set<Task> subtasks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id")
    private WorkflowStatus status;

    @Enumerated(EnumType.STRING)
    private TaskType taskType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id")
    private Sprint sprint;

    @Column(name = "story_points")
    private Integer storyPoints;

}
