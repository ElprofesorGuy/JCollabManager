package com.elprofesor.collaborationtool.server.bootstrap;

import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.models.Role;
import com.elprofesor.collaborationtool.server.models.Status;
import com.elprofesor.collaborationtool.server.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class BootstrapData implements CommandLineRunner {
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        loadUserData();
        loadProjectData();
        loadTaskData();
    }

    private void loadTaskData(){
        Optional<Users> user1 = userRepository.findByUsername("Le natif");
        Optional<Users> user2 = userRepository.findByUsername("Le monstre");
        Optional<Users> user3 = userRepository.findByUsername("Charlie");
        Optional<Users> user4 = userRepository.findByUsername("Bobby");
        Optional<Users> user5 = userRepository.findByUsername("Diana");

        Project p1 = projectRepository.findByTitleContainingIgnoreCase("Meloaude");
        Project p2 = projectRepository.findByTitleContainingIgnoreCase("Wylov");
        Project p3 = projectRepository.findByTitleContainingIgnoreCase("Cloud");
        if(taskRepository.count() == 0){
            Task task1 = Task.builder()
                    .title("Maquetes UI")
                    .status(Status.END)
                    .description("Créer les maquettes sur Figma")
                    .creation_date(LocalDate.now())
                    .project(p1)
                    .assign_to(user3.get())
                    .build();

            Task task2 = Task.builder()
                    .status(Status.NOT_FINISH)
                    .creation_date(LocalDate.now())
                    .title("Intégration HTML/CSS")
                    .description("Intégrer les maquettes validées")
                    .project(p1)
                    .assign_to(user4.get())
                    .build();
            Task task3 = Task.builder()
                    .status(Status.TO_DO)
                    .creation_date(LocalDate.now())
                    .title("Optimisation SEO")
                    .description("Mettre en place les balises meta et sitemap")
                    .project(p1)
                    .assign_to(user3.get())
                    .build();
            Task task4 = Task.builder()
                    .creation_date(LocalDate.now())
                    .title("Tests cross-browser")
                    .description("Tester sur Chrome, Firefox, Safari")
                    .status(Status.TO_DO)
                    .project(p2)
                    .assign_to(user5.get())
                    .build();
            Task task5 = Task.builder()
                    .title("Cahier de charges")
                    .description("Rédiger le cahier des charges fonctionnels")
                    .creation_date(LocalDate.now())
                    .status(Status.END)
                    .project(p2)
                    .assign_to(user5.get())
                    .build();
            Task task6 = Task.builder()
                    .title("Setup React Native")
                    .description("Initialiser le projet React Native")
                    .creation_date(LocalDate.now())
                    .status(Status.NOT_FINISH)
                    .project(p2)
                    .assign_to(user3.get())
                    .build();
            Task task7 = Task.builder()
                    .title("Ecran authentification")
                    .description("Développer les écrans login et register")
                    .creation_date(LocalDate.now())
                    .status(Status.END)
                    .project(p3)
                    .assign_to(user2.get())
                    .build();
            Task task8 = Task.builder()
                    .title("Intégration API REST")
                    .description("Connectier l'app aux endpoints backend")
                    .creation_date(LocalDate.now())
                    .status(Status.TO_DO)
                    .project(p3)
                    .assign_to(user4.get())
                    .build();
            Task task9 = Task.builder()
                    .creation_date(LocalDate.now())
                    .title("Configuratio AWS")
                    .description("Configurer les services EC2, S3, RDS")
                    .status(Status.TO_DO)
                    .project(p3)
                    .assign_to(user2.get())
                    .build();

            taskRepository.saveAll(List.of(task1, task2, task3, task4, task5, task6, task7, task8, task9));

        }
    }

    private void loadProjectData(){
        Optional<Users> user1 = userRepository.findByUsername("Le natif");
        Optional<Users> user2 = userRepository.findByUsername("Le monstre");
        Optional<Users> user3 = userRepository.findByUsername("Charlie");
        Optional<Users> user4 = userRepository.findByUsername("Bobby");
        Optional<Users> user5 = userRepository.findByUsername("Diana");
        if(projectRepository.count() == 0){
            Project project1 = Project.builder()
                    .title("Meloaude")
                    .description("Application de gestion de transactions financières")
                    .creation_date(LocalDate.now())
                    .owner(user1.get())
                    .build();

            Project project2 = Project.builder()
                    .title("Wylov Pro")
                    .creation_date(LocalDate.now())
                    .description("Application de gestion des stocks")
                    .owner(user2.get())
                    .build();

            Project project3 = Project.builder()
                    .title("Migration Cloud")
                    .description("Migration de l'infrastructure vers AWS")
                    .creation_date(LocalDate.now())
                    .owner(user1.get())
                    .build();
            Set<Users> members1 = new HashSet<>();
            members1.add(user1.get());
            members1.add(user3.get());
            members1.add(user4.get());
            Set<Users> members2 = new HashSet<>();
            members2.add(user2.get());
            members2.add(user3.get());
            members2.add(user5.get());
            Set<Users> members3 = new HashSet<>();
            members3.add(user1.get());
            members3.add(user2.get());
            members3.add(user5.get());
            project1.setMembers(members1);
            project2.setMembers(members2);
            project3.setMembers(members3);
            projectRepository.saveAll(List.of(project1, project2, project3));
        }
    }

    private void loadUserData(){
        if(userRepository.count() == 0){
            Users user1 = Users.builder()
                    .date_creation(LocalDate.now())
                    .email("guyeinstein@gmail.com")
                    .role(Role.ADMIN)
                    .username("Le natif")
                    .password(passwordEncoder.encode("aileDe Pigeon"))
                    .build();

            Users user2 = Users.builder()
                    .date_creation(LocalDate.now())
                    .username("Le monstre")
                    .role(Role.MEMBER)
                    .password(passwordEncoder.encode("taGueuleCHEVRE"))
                    .email("toctoc25@gmail.com")
                    .build();
            Users user3 = Users.builder()
                    .date_creation(LocalDate.now())
                    .email("charlie@example.com")
                    .username("Charlie")
                    .password(passwordEncoder.encode("ma date de naissance"))
                    .role(Role.MEMBER)
                    .build();
            Users user4 = Users.builder()
                    .date_creation(LocalDate.now())
                    .email("diana@example.com")
                    .username("Diana")
                    .password(passwordEncoder.encode("nsA ma ViE"))
                    .role(Role.MEMBER)
                    .build();
            Users user5 = Users.builder()
                    .date_creation(LocalDate.now())
                    .email("bob@example.com")
                    .password(passwordEncoder.encode("boby la terreur"))
                    .username("Bobby")
                    .role(Role.MEMBER)
                    .build();
            userRepository.saveAll(List.of(user1, user2, user3, user4, user5));
        }
    }
}
