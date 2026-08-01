package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.*;
import com.elprofesor.collaborationtool.server.mapper.*;
import com.elprofesor.collaborationtool.server.models.*;
import com.elprofesor.collaborationtool.server.repositories.*;
import com.elprofesor.collaborationtool.server.security.CustomUserServiceDetails;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Validated
@Transactional
public class ProjectServiceJPA implements ProjectService {

    private final ProjectMapper projectMapper;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final WorkflowStatusRepository workflowStatusRepository;
    private final WorkflowTransitionRepository workflowTransitionRepository;
    private final WorkflowStatusMapper mapper;
    private final ProjectMembershipRepository projectMembershipRepository;
    private final ProjectMemberMapper projectMemberMapper;
    private final CustomUserServiceDetails customUserDetails;
    private final NotificationService notificationService;

    @Override
    public List<ProjectResponseDTO> listProjects() {
        return projectRepository.findAll()
                .stream()
                .map(projectMapper::projectToProjectResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProjectResponseDTO> listMyProjects(UserDetails userDetails) {
        Users currentUser = customUserDetails.getCurrentUser(userDetails);
        List<ProjectMembership> projectMemberships = projectMembershipRepository.findByUser(currentUser);
        return projectMemberships
                .stream()
                .map(ProjectMembership::getProject)
                .map(projectMapper::projectToProjectResponseDto)
                .toList();
    }


    @Override
    public Optional<ProjectResponseDTO> getProjectById(UUID id) {
        return Optional.of(projectMapper.projectToProjectResponseDto(projectRepository.findById(id).orElseThrow(NotFoundException::new)));
    }

    @Override
    public ProjectResponseDTO saveNewProject(ProjectRequestDTO projectRequestDTO) {
        Project projectToSave = projectMapper.projectRequestDtoToProject(projectRequestDTO);
        WorkflowStatus defaultWorkflowStauts1 = mapper.workflowStatusRequestDtoToWorkflowStatus(
                        WorkflowStatusRequestDTO.builder()
                                .completed(false)
                                .name("A Faire")
                                .orderIndex(0)
                                .build()
                );
        defaultWorkflowStauts1.setProject(projectToSave);
        WorkflowStatus defaultWorfflowStatus2 = mapper.workflowStatusRequestDtoToWorkflowStatus(
                WorkflowStatusRequestDTO.builder()
                .completed(false)
                .name("En cours")
                .orderIndex(1)
                .build());
        defaultWorfflowStatus2.setProject(projectToSave);
        WorkflowStatus defaultWorfflowStatus3 = mapper.workflowStatusRequestDtoToWorkflowStatus(
                WorkflowStatusRequestDTO.builder()
                .completed(true)
                .name("Terminé")
                .orderIndex(2)
                .build());
        defaultWorfflowStatus3.setProject(projectToSave);
        ProjectResponseDTO responseDTO = projectMapper.projectToProjectResponseDto(projectRepository.save(projectToSave));
        Users manager = userRepository.findByEmail(projectRequestDTO.getManagerEmail()).orElseThrow(()->
                new NotFoundException("Utilisateur inexistant"));
        ProjectMembership newMembership = ProjectMembership.builder()
                .user(manager)
                .project(projectToSave)
                .role(ProjectRole.MANAGER)
                .joined_at(LocalDate.now())
                .build();
        projectMembershipRepository.save(newMembership);
        List<WorkflowStatus> savedStatuses = workflowStatusRepository.saveAll(List.of(defaultWorkflowStauts1, defaultWorfflowStatus2, defaultWorfflowStatus3));
        WorkflowStatus todo = savedStatuses.get(0);
        WorkflowStatus inProgress = savedStatuses.get(1);
        WorkflowStatus done = savedStatuses.get(2);
        workflowTransitionRepository.saveAll(List.of(
                WorkflowTransition.builder()
                        .project(projectToSave)
                        .fromStatus(todo)
                        .toStatus(inProgress)
                        .name("Demarrer le travail")
                        .requiredRole(ProjectRole.CONTRIBUTOR)
                        .build(),
                WorkflowTransition.builder()
                        .project(projectToSave)
                        .fromStatus(inProgress)
                        .toStatus(done)
                        .name("Terminer")
                        .requiredRole(ProjectRole.CONTRIBUTOR)
                        .build(),
                WorkflowTransition.builder()
                        .project(projectToSave)
                        .fromStatus(done)
                        .toStatus(inProgress)
                        .name("Reouvrir")
                        .requiredRole(ProjectRole.MANAGER)
                        .build()
        ));
        responseDTO.setManagerEmail(manager.getEmail());
        return responseDTO;
    }

    @Override
    public Optional<ProjectRequestDTO> updateProjectById(UUID id, ProjectRequestDTO projectRequestDTO) {
        AtomicReference<Optional<ProjectRequestDTO>> atomicReference = new AtomicReference<>();
        projectRepository.findById(id).ifPresentOrElse(foundProject -> {
            foundProject.setTitle(projectRequestDTO.getTitle());
            foundProject.setDescription(projectRequestDTO.getDescription());
            foundProject.setUpdate_date(LocalDate.now());
            /*NotificationRequestDTO dto = NotificationRequestDTO.builder()
                    .type(NotificationType.PROJET_MODIFIE)
                    .message("Les informations sur un projet ont été mises à jour")
                    //.recipientUsername(foundProject.getOwner().getUsername())
                    .targetUrl("/projects/" + foundProject.getId())
                    .build();
            notificationService.saveNewNotification(dto);*/
            Project savedProject = projectRepository.save(foundProject);
            atomicReference.set(Optional.of(projectMapper.projectToProjectRequestDto(savedProject)));
        }, () -> {
            atomicReference.set(Optional.empty());
        });
        return atomicReference.get();
    }

    @Override
    public Boolean deleteProject(UUID id) {

        if(projectRepository.existsById(id)){
            Project deletedProject = projectRepository.findById(id).orElseThrow(()-> new NotFoundException("Project not found"));
            List<WorkflowStatus> workflowStatuses = workflowStatusRepository.findByProject_Id(id);
            projectMembershipRepository.deleteAll(deletedProject.getMemberships());
            workflowTransitionRepository.deleteByProjectId(id);
            workflowStatusRepository.deleteAll(workflowStatuses);
            projectRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /*@Override
    public Project getProjectByTitle(String keyword) {
        return projectRepository.findByTitleContainingIgnoreCase(keyword);
    }*/

    @Override
    public ProjectResponseDTO addMembers(UUID projectId, String memberEmail, UserDetails userDetails, ProjectRole projectRole) {
        Users currentUser = customUserDetails.getCurrentUser(userDetails);
         Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException(
                        "Projet introuvable : " + projectId
                ));
        String cleanedEmail = memberEmail.replaceAll("\"", "").trim();
        Users newMember = userRepository.findByEmail(cleanedEmail)
                .orElseThrow(() -> new NotFoundException("Utilisateur avec cet email introuvable : " + memberEmail));

        ProjectMembership newMembership = ProjectMembership.builder()
                .project(project)
                .user(newMember)
                .invitedBy(currentUser)
                .joined_at(LocalDate.now())
                .role(projectRole)
                .build();
        projectMembershipRepository.save(newMembership);
        project.getMemberships().add(newMembership);
        return projectMapper.projectToProjectResponseDto(projectRepository.save(project));
    }

    @Override
    public ProjectResponseDTO removeMembers(UUID projectId, @Email String memberEmail) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new NotFoundException(
                        "Projet introuvable : " + projectId));
        Users deletedUser = userRepository.findByEmail(memberEmail)
                .orElseThrow(()-> new NotFoundException("Utilisateur inexistant"));
        if(deletedUser.equals(null)) {
            System.out.println("Value not found");
        }else {
            System.out.println("Utilisateur membre à supprimer");
        }
        if(project.equals(null)){
            System.out.println("Value of project not found");
        } else{
            System.out.println("Project trouvé");
        }

        ProjectMembership projectMembership = projectMembershipRepository.findByProjectAndUser(project, deletedUser);
        if(!projectMembership.equals(null)){
            project.getMemberships().remove(projectMembership);
            projectMembershipRepository.delete(projectMembership);
        }

        return projectMapper.projectToProjectResponseDto(projectRepository.save(project));
    }

    @Override
    public Set<ProjectMemberResponseDTO> displayMembersOfaProject(UUID projectId) {
        List<ProjectMembership> memberships = projectMembershipRepository.findByProjectId(projectId);
        return memberships.stream()
                .map(projectMemberMapper::toProjectMemberResponseDto)
                .collect(Collectors.toSet());

    }

    @Override
    public ProjectResponseDTO removeTask(UUID projectId, String taskTitle) {
        Task taskToDelete = taskRepository.findByTitleContainingIgnoreCase(taskTitle).orElseThrow( () -> new NotFoundException("Tâche inexistante"));
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new NotFoundException("Projet inexistant"));

       project.getTasks().remove(taskToDelete);
        return projectMapper.projectToProjectResponseDto(project);
    }

    @Override
    public Set<TaskResponseDTO> listOfTasks(UUID projectId) {
        Optional <Project> project = projectRepository.findById(projectId);
        return project.get().getTasks()
                .stream()
                .map(taskMapper::taskToTaskResponseDto)
                .collect(Collectors.toSet());
    }


}
