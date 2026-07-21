package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.*;
import com.elprofesor.collaborationtool.server.mapper.*;
import com.elprofesor.collaborationtool.server.models.*;
import com.elprofesor.collaborationtool.server.repositories.*;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
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
    private final WorkflowStatusMapper mapper;
    private final ProjectMembershipRepository projectMembershipRepository;
    private final ProjectMemberMapper projectMemberMapper;

    @Override
    public List<ProjectResponseDTO> listProjects() {
        return projectRepository.findAll()
                .stream()
                .map(projectMapper::projectToProjectResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProjectResponseDTO> listMyProjects(Users currentUser) {
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
    public ProjectResponseDTO saveNewProject(ProjectRequestDTO projectRequestDTO, Users currentUser) {
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
        if(responseDTO.equals(null)){
            System.out.println("System error");
        }else{
            System.out.println("Elément enregistré avec succès");
        }
        Optional<Users> manager = userRepository.findByEmail(projectRequestDTO.getManagerEmail());
        //System.out.println("Nom de l'utilisateur trouvé : " + manager.getUsername());
        if(manager.isEmpty()){
            System.out.println("Retour sur la recherche de l'utilisateur : " + "utilisateur inexistant");
        }else{
            System.out.println("Manager retrouvé");
            System.out.println("Email du manager : " + manager.get().getEmail());
        }
        ProjectMembership newMembership = ProjectMembership.builder()
                .user(manager.get())
                .project(projectToSave)
                .role(ProjectRole.MANAGER)
                .joined_at(LocalDate.now())
                .build();
        projectMembershipRepository.save(newMembership);
        workflowStatusRepository.saveAll(List.of(defaultWorkflowStauts1, defaultWorfflowStatus2,defaultWorfflowStatus3));
        responseDTO.setManagerEmail(manager.get().getEmail());
        return responseDTO;
    }

    @Override
    public Optional<ProjectRequestDTO> updateProjectById(UUID id, ProjectRequestDTO projectRequestDTO, Users currentUser) {
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
            workflowStatusRepository.deleteAll(workflowStatuses);
            projectRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Override
    public Project getProjectByTitle(String keyword) {
        return projectRepository.findByTitleContainingIgnoreCase(keyword);
    }

    @Override
    public ProjectResponseDTO addMembers(UUID projectId, @Email String memberEmail, Users currentUser, ProjectRole projectRole) {
         Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException(
                        "Projet introuvable : " + projectId
                ));
         System.out.println("========== NOM DU PROJET ==========" + project.getTitle());
        Users newMember = userRepository.findByEmail(memberEmail).orElseThrow(()-> new NotFoundException("Not Found this user"));
        System.out.println("========== NOM DU NOUVEL ADHERENT : " + newMember.getUsername());
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
    public ProjectResponseDTO removeTask(UUID projectId, String taskTitle, Users currentUser) {
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
