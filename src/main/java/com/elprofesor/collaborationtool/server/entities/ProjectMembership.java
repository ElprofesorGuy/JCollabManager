package com.elprofesor.collaborationtool.server.entities;

import com.elprofesor.collaborationtool.server.models.ProjectRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "project_id"})
})//Un utilisateur ne peut pas avoir deux rôles dans le même projet, d'où cette contrainte d'unicité
//Cette classe est indispensable pour gérer les différents rôles des utilisateurs dans différents proje
public class ProjectMembership {

    @Id
    @UuidGenerator
    @GeneratedValue(generator = "UUID")
    @Column(updatable = false, nullable = false)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable=false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectRole role;

    @CreationTimestamp
    private LocalDate joined_at;

    @ManyToOne
    @JoinColumn(name = "invited_by_id", nullable = true)
    private Users invitedBy;

}
