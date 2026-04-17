package com.elprofesor.collaborationtool.server.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Project {
    @Id
    @GeneratedValue(generator = "UUID")
    @UuidGenerator
    @Column(length = 36, columnDefinition = "varchar", updatable = false, nullable = false)
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

    @ManyToOne
    @JoinColumn(name = "owner_id", columnDefinition = "uuid")
    private Users owner;

    @OneToMany(mappedBy = "project")
    private Set<Task> tasks = new HashSet<>();

    @ManyToMany
    @JoinTable(name = "project_members",
    joinColumns = @JoinColumn(name = "project_id", columnDefinition = "uuid"),
    inverseJoinColumns = @JoinColumn(name = "user_id", columnDefinition = "uuid"))
    private Set<Users> members = new HashSet<>();

    public void addMember(Users member){
        this.members.add(member);
        member.getProjects().add(this);
    }

    public void removeMember(Users member){
        this.members.remove(member);
        member.getProjects().remove(this);
    }
}
