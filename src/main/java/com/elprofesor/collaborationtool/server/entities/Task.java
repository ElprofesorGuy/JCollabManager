package com.elprofesor.collaborationtool.server.entities;


import com.elprofesor.collaborationtool.server.models.Status;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.HashSet;
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

    @Column(length = 50)
    @Size(max = 50)
    private String title;

    @NotNull
    private String description;

    @Enumerated (EnumType.STRING)
    @Column(nullable = false)
    private Status status;
    
    @Column(name = "attachment_url")
    private String attachmentUrl;


    @Column(name = "date_echeance")
    private LocalDate dateEcheance;

    @CreationTimestamp
    private LocalDate creation_date;

    @ManyToOne
    @JoinColumn(name = "project_id", columnDefinition = "uuid")
    private Project project;

    @ManyToOne
    @JoinColumn(name = "assign_to", columnDefinition = "uuid")
    private Users assign_to;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    @OneToMany(mappedBy = "predecessor", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TaskDependency> predecessorDependencies;

    @OneToMany(mappedBy = "successor", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TaskDependency> successorDependencies;


}
