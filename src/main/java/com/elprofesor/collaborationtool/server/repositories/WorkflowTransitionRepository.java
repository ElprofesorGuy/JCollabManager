package com.elprofesor.collaborationtool.server.repositories;

import com.elprofesor.collaborationtool.server.entities.WorkflowStatus;
import com.elprofesor.collaborationtool.server.entities.WorkflowTransition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkflowTransitionRepository extends JpaRepository<WorkflowTransition, UUID> {
    List<WorkflowTransition> findByProjectId(UUID projectId);
    List<WorkflowTransition> findByProjectIdAndFromStatusId(UUID projectId, UUID fromStatusId);
    Optional<WorkflowTransition> findByProjectIdAndFromStatusAndToStatus(UUID projectId, WorkflowStatus fromStatus, WorkflowStatus toStatus);
    void deleteByProjectId(UUID projectId);
    void deleteByFromStatusIdOrToStatusId(UUID fromStatusId, UUID toStatusId);
}
