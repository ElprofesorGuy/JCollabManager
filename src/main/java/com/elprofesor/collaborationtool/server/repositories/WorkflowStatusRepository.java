package com.elprofesor.collaborationtool.server.repositories;

import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.entities.WorkflowStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkflowStatusRepository extends JpaRepository<WorkflowStatus, UUID> {
    Optional<WorkflowStatus> findByNameIgnoringCaseAndProject(String name, Project projet);
    List<WorkflowStatus> findByProject_Id(UUID projectId);
    WorkflowStatus findByProjectIdAndOrderIndex(UUID projectId, int index);
    List<WorkflowStatus> findByProjectIdOrderByOrderIndexAsc(UUID projectId);
    Optional<WorkflowStatus> findByNameIgnoringCase(String status);
    List<WorkflowStatus> findAllByOrderIndexNotAndCompletedFalse(int index);
    List<WorkflowStatus> findAllByOrderIndex(int index);
}
