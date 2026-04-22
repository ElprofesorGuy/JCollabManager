package com.elprofesor.collaborationtool.server.repositories;

import com.elprofesor.collaborationtool.server.entities.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    Optional<Task> findByTitleContainingIgnoreCase(String title);
}
