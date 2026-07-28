package com.elprofesor.collaborationtool.server.repositories;

import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.entities.WorkflowStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    Optional<Task> findByTitleContainingIgnoreCase(String title);
    List<Task> findAllByStatus(WorkflowStatus taskStatus);
    List<Task> findByDateEcheanceBetweenAndStatus_CompletedFalse(LocalDate startDate, LocalDate deadline);

    Page<Task> findByTitleIsLikeIgnoreCase(String taskTitle, Pageable pageable);

    Page<Task> findAllByStatus(WorkflowStatus status, Pageable pageable);

    Page<Task> findByTitleIsLikeIgnoreCaseAndStatus(String taskTitle, WorkflowStatus status, Pageable pageable);

    List<Task> findByStatusIn(List<WorkflowStatus> statuses);

}
