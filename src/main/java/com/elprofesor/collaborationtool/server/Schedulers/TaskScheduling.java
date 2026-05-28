package com.elprofesor.collaborationtool.server.Schedulers;

import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.models.Status;
import com.elprofesor.collaborationtool.server.repositories.TaskRepository;
import com.elprofesor.collaborationtool.server.services.EmailSenderService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskScheduling {
    private final TaskRepository taskRepository;
    private final EmailSenderService emailSenderService;

    //Tous les jours à minuit, le Scheduler met à jour les tâches marquées OVERDUE
    @Scheduled(cron = "0 30 0 * * *")
    public void markTaskOverdue(){
        List<Task> overdueTasks = taskRepository
                .findByDateEcheanceBeforeAndStatusNot(LocalDate.now(), Status.END);

        overdueTasks.forEach(task -> {
            task.setStatus(Status.OVERDUE);
            System.out.println("Changement de status de la tâche : " + task.getTitle());
        });
        taskRepository.saveAll(overdueTasks);
        System.out.println("Activation du Scheduling");
    }

    //Notifie
    @Scheduled(cron = "0 0 8 * * *")//Chaque jour à 8:00
    public void notifyUpcomingDeadline(){
        LocalDate deadline = LocalDate.now().plusDays(3);
        List<Task> upcomingDeadlineTask = taskRepository.findByDateEcheanceBetweenAndStatusNot(LocalDate.now(), deadline, Status.END);
        upcomingDeadlineTask.forEach(upcomingTask ->{
            String email = upcomingTask.getAssign_to().getEmail();
            String message = "Bonjour " + upcomingTask.getAssign_to().getUsername() + ". La deadline de la tâche : " + upcomingTask.getTitle() + " est le " + upcomingTask.getDateEcheance()
                    + ". Dépêchez vous de la terminer.";
            emailSenderService.sendMail(email, "Deadline de la tâche", message);
            System.out.println("Email envoyé.");
        });
    }
    
}
