package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;

import java.util.Objects;
import java.util.UUID;

@Builder
public class TaskDependencyRequestDTO {
    private UUID predecessorId;
    private UUID successorId;
    private UUID projectId;

    public UUID getPredecessorId() {
        return predecessorId;
    }

    public void setPredecessorId(UUID predecessorId) {
        this.predecessorId = predecessorId;
    }

    public UUID getSuccessorId() {
        return successorId;
    }

    public void setSuccessorId(UUID successorId) {
        this.successorId = successorId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    @Override
    public final boolean equals(Object o) {
        if (!(o instanceof TaskDependencyRequestDTO that)) return false;

        return Objects.equals(getPredecessorId(), that.getPredecessorId()) && Objects.equals(getSuccessorId(), that.getSuccessorId()) && Objects.equals(getProjectId(), that.getProjectId());
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(getPredecessorId());
        result = 31 * result + Objects.hashCode(getSuccessorId());
        result = 31 * result + Objects.hashCode(getProjectId());
        return result;
    }

    @Override
    public String toString() {
        return "TaskDependencyRequestDTO{" +
                "predecessorId=" + predecessorId +
                ", successorId=" + successorId +
                ", projectId=" + projectId +
                '}';
    }
}
