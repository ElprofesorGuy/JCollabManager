package com.elprofesor.collaborationtool.server.entities;

import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TaskDependency {
    @Id
    @GeneratedValue(generator = "UUID")
    @UuidGenerator
    private UUID taskDependencyId;

    @Column(name = "project_id")
    private UUID projectId;

    @ManyToOne
    @JoinColumn(name = "predecessor_id", columnDefinition = "uuid")
    private Task predecessor;

    @ManyToOne
    @JoinColumn(name = "successor_id", columnDefinition = "uuid")
    private Task successor;
}
