package com.elprofesor.collaborationtool.server.Schedulers;

import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.models.Status;
import com.elprofesor.collaborationtool.server.repositories.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskScheduling {
    private final TaskRepository taskRepository;

    //Tous les jours à minuit, le Scheduler met à jour les tâches marquées OVERDUE
    @Scheduled(cron = "0 0 0 * * *")
    public void markTaskOverdue(){
        List<Task> overdueTasks = taskRepository
                .findByDateEcheanceBeforeAndStatusNot(LocalDate.now(), Status.END);

        overdueTasks.forEach(task -> {
            task.setStatus(Status.OVERDUE);
        });
        taskRepository.saveAll(overdueTasks);
    }
}
