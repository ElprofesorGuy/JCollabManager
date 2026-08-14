package com.elprofesor.collaborationtool.server.repositories;

import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.entities.WorkflowStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    
    @EntityGraph(attributePaths = {"project", "assignTo", "status"})
    Optional<Task> findByTitleContainingIgnoreCase(String title);
    
    @EntityGraph(attributePaths = {"project", "assignTo", "status"})
    List<Task> findAllByStatus(WorkflowStatus taskStatus);
    
    @EntityGraph(attributePaths = {"project", "assignTo", "status"})
    List<Task> findByDateEcheanceBetweenAndStatus_CompletedFalse(LocalDate startDate, LocalDate deadline);

    @EntityGraph(attributePaths = {"project", "assignTo", "status"})
    Page<Task> findByTitleIsLikeIgnoreCase(String taskTitle, Pageable pageable);

    @EntityGraph(attributePaths = {"project", "assignTo", "status"})
    Page<Task> findAllByStatus(WorkflowStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"project", "assignTo", "status"})
    Page<Task> findByTitleIsLikeIgnoreCaseAndStatus(String taskTitle, WorkflowStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"project", "assignTo", "status"})
    List<Task> findByStatusIn(List<WorkflowStatus> statuses);

    @EntityGraph(attributePaths = {"project", "assignTo", "status"})
    List<Task> findAllByAssignToId(UUID userId);
}
