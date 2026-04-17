package com.elprofesor.collaborationtool.server.entities;

import com.elprofesor.collaborationtool.server.models.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@Entity
@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = "projects")
public class Users {
    @Id
    @GeneratedValue(generator = "UUID")
    @UuidGenerator
    @Column(length = 36, updatable = false, nullable = false)
    @EqualsAndHashCode.Include
    private UUID id;

    @NotNull
    @NotBlank
    @Column(length = 50)
    @Size(max = 50)
    private String username;

    @NotNull
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;


    @NotNull
    private LocalDate date_creation;

    @OneToMany(mappedBy = "owner")
    private Set<Project> projects;

    @OneToMany(mappedBy = "assign_to")
    private Set<Task> tasks;

    @NotNull
    @Column(name = "password_hash")
    private String password;
}
