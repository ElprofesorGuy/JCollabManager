package com.elprofesor.collaborationtool.server.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.util.Objects;
import java.util.UUID;

@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStatus {

    @Id
    @UuidGenerator
    @GeneratedValue(generator = "UUID")
    @Column(updatable = false, nullable = false)
    private UUID id;

    private String name;
    private int orderIndex;
    private boolean completed;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(int orderIndex) {
        this.orderIndex = orderIndex;
    }

    public boolean getCompleted() {
        return completed;
    }

    public void setCompleted(boolean end) {
        this.completed = end;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    @Override
    public final boolean equals(Object o) {
        if (!(o instanceof WorkflowStatus that)) return false;

        return getOrderIndex() == that.getOrderIndex() && getCompleted() == that.getCompleted() && Objects.equals(getId(), that.getId()) && Objects.equals(getName(), that.getName()) && Objects.equals(getProject(), that.getProject());
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(getId());
        result = 31 * result + Objects.hashCode(getName());
        result = 31 * result + getOrderIndex();
        result = 31 * result + Boolean.hashCode(getCompleted());
        result = 31 * result + Objects.hashCode(getProject());
        return result;
    }

    @Override
    public String toString() {
        return "WorkflowStatus{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", orderIndex=" + orderIndex +
                ", completed=" + completed +
                ", project=" + project +
                '}';
    }
}
