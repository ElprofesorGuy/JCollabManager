package com.elprofesor.collaborationtool.server.entities;

import com.elprofesor.collaborationtool.server.models.SprintStatus;
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

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Sprint {

    @Id
    @GeneratedValue(generator = "UUID")
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    @EqualsAndHashCode.Include
    private UUID id;

    @NotNull
    @Column(length = 100)
    @Size(max = 100)
    private String name;

    @Column(length = 255)
    @Size(max = 255)
    private String goal;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SprintStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @CreationTimestamp
    @Column(name = "creation_date")
    private LocalDate creationDate;

    @OneToMany(mappedBy = "sprint")
    @Builder.Default
    private Set<Task> tasks = new HashSet<>();

    @Override
    public String toString() {
        return "Sprint{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", goal='" + goal + '\'' +
                ", status=" + status +
                '}';
    }
}
