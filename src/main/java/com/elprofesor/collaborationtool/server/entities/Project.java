package com.elprofesor.collaborationtool.server.entities;

import com.elprofesor.collaborationtool.server.models.ProjectRole;
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
//@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Project {
    @Id
    @GeneratedValue(generator = "UUID")
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    @EqualsAndHashCode.Include
    private UUID id;

    @NotNull
    @Column(length = 50)
    @Size(max = 50)
    private String title;

    @NotNull
    private String description;

    @CreationTimestamp
    private LocalDate creation_date;

    @CreationTimestamp
    private LocalDate update_date;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Task> tasks = new HashSet<>();

    //new
    @OneToMany(mappedBy="project", cascade=CascadeType.ALL)
    private Set<ProjectMembership> memberships = new HashSet<>();

    public void addTask(Task task){
        if(this.tasks == null){
            this.tasks = new HashSet<>();
        }
        this.tasks.add(task);
    }

    public Users getUser(){
        if(this.memberships == null) return null;
        return this.memberships.stream()
                .filter(managerUser -> managerUser.getRole() == ProjectRole.MANAGER)
                .map(ProjectMembership::getUser)
                .findFirst().orElse(null);
    }

    /*public void setUser(String email){
        Users manager = getUser();
        manager.setEmail(email);
    }*/

}
