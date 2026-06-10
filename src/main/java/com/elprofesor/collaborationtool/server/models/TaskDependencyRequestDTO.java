package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;

import java.util.Objects;
import java.util.UUID;

@Builder
public class TaskDependencyRequestDTO {
    private UUID predecessorId;
    private UUID successorId;

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

    @Override
    public final boolean equals(Object o) {
        if (!(o instanceof TaskDependencyRequestDTO that)) return false;

        return Objects.equals(getPredecessorId(), that.getPredecessorId()) && Objects.equals(getSuccessorId(), that.getSuccessorId());
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(getPredecessorId());
        result = 31 * result + Objects.hashCode(getSuccessorId());
        return result;
    }

    @Override
    public String toString() {
        return "TaskDependencyRequestDTO{" +
                "predecessorId=" + predecessorId +
                ", successorId=" + successorId +
                '}';
    }
}
