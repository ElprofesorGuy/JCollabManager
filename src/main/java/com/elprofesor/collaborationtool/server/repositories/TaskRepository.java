package com.elprofesor.collaborationtool.server.repositories;

import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.models.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {
    Optional<Task> findByTitleContainingIgnoreCase(String title);

    //Retourne la liste des tâches qui dont l'échéance est atteinte et qui n'ont pas
    //encore été terminées.
    List<Task> findByDateEcheanceBeforeAndStatusNot(LocalDate date, Status taskStatus);

    List<Task> findByStatus(Status taskStatus);
    List<Task> findByDateEcheanceBefore(LocalDate deadline);
}
