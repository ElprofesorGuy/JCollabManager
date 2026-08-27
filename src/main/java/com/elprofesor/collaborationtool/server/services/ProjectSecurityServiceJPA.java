package com.elprofesor.collaborationtool.server.services;


import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.entities.ProjectMembership;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.models.ProjectRole;
import com.elprofesor.collaborationtool.server.models.SystemRole;
import com.elprofesor.collaborationtool.server.repositories.ProjectMembershipRepository;
import com.elprofesor.collaborationtool.server.repositories.ProjectRepository;
import com.elprofesor.collaborationtool.server.repositories.TaskRepository;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectSecurityServiceJPA implements ProjectSecurityService {

    private final ProjectMembershipRepository projectMembershipRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    @Override
    public boolean hasProjectRole(UUID projectId, String requiredRole){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails user = (UserDetails) authentication.getPrincipal();
        Users currentUser = userRepository.findByUsername(user.getUsername()).orElseThrow(() -> new NotFoundException("Utilisateur inexistant"));
        // ADMIN has full read/write access to all projects
        if (currentUser.getRole() == SystemRole.ADMIN) return true;
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new NotFoundException("Project inexistant"));
        ProjectMembership projectMembership = projectMembershipRepository.findByProjectAndUser(project, currentUser);
        if (projectMembership == null) return false;
        return projectMembership.getRole().name().equals(requiredRole);
    }

    // Vérifie si un utilisateur peut supprimer une tâche
    @Override
    public boolean canDeleteTask(UUID taskId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails user = (UserDetails) authentication.getPrincipal();
        Users currentUser = userRepository.findByUsername(user.getUsername()).orElseThrow(() -> new NotFoundException("Utilisateur inexistant"));
        if (currentUser.getRole() == SystemRole.ADMIN) return true;
        Project project = taskRepository.findById(taskId).get().getProject();
        ProjectMembership membership = projectMembershipRepository.findByProjectIdAndUserId(project.getId(), currentUser.getId());
        if (membership == null) return false;

        return membership.getRole() == ProjectRole.MANAGER;
    }
    // Vérifie si un utilisateur peut créer une tâche
    @Override
    public boolean canCreateTask(UUID projectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails user = (UserDetails) authentication.getPrincipal();
        Users currentUser = userRepository.findByUsername(user.getUsername()).orElseThrow(() -> new NotFoundException("Utilisateur inexistant"));
        if (currentUser.getRole() == SystemRole.ADMIN) return true;
        ProjectMembership membership = projectMembershipRepository.findByProjectIdAndUserId(projectId, currentUser.getId());
        if (membership == null) return false;

        return membership.getRole() == ProjectRole.MANAGER || membership.getRole() == ProjectRole.CONTRIBUTOR;
    }

    //Vérifie si un utlisateur peut modifier les informations d'une tâche
    @Override
    public boolean canUpdateTask(UUID projectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails user = (UserDetails) authentication.getPrincipal();
        Users currentUser = userRepository.findByUsername(user.getUsername()).orElseThrow(() -> new NotFoundException("Utilisateur inexistant"));
        if (currentUser.getRole() == SystemRole.ADMIN) return true;
        ProjectMembership membership = projectMembershipRepository.findByProjectIdAndUserId(projectId, currentUser.getId());
        if (membership == null) return false;

        return membership.getRole() == ProjectRole.MANAGER || membership.getRole() == ProjectRole.CONTRIBUTOR;
    }

    @Override
    public boolean canUpdateProject(UUID projectId, UUID userId) {
        ProjectMembership membership = projectMembershipRepository.findByProjectIdAndUserId(projectId, userId);
        if (membership == null) return false;

        return membership.getRole() == ProjectRole.MANAGER;
    }

    @Override
    public boolean canCreateUser(Users currentUser) {
        return currentUser.getRole() == SystemRole.ADMIN;
    }

    @Override
    public boolean canModifyStatusName(UUID projectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails user = (UserDetails) authentication.getPrincipal();
        Users currentUser = userRepository.findByUsername(user.getUsername()).orElseThrow(() -> new NotFoundException("Utilisateur inexistant"));
        if (currentUser.getRole() == SystemRole.ADMIN) return true;
        ProjectMembership membership = projectMembershipRepository.findByProjectIdAndUserId(projectId, currentUser.getId());
        if (membership == null) return false;
        return membership.getRole() == ProjectRole.MANAGER || membership.getRole() == ProjectRole.CONTRIBUTOR || membership.getRole() == ProjectRole.REVIEWER;
    }

    @Override
    public boolean isProjectMember(UUID projectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails user = (UserDetails) authentication.getPrincipal();
        Users currentUser = userRepository.findByUsername(user.getUsername()).orElseThrow(() -> new NotFoundException("Utilisateur inexistant"));
        if (currentUser.getRole() == SystemRole.ADMIN) return true;
        ProjectMembership membership = projectMembershipRepository.findByProjectIdAndUserId(projectId, currentUser.getId());
        if(membership == null) return false;

        return membership.getRole() == ProjectRole.MANAGER || membership.getRole() == ProjectRole.CONTRIBUTOR ||
                membership.getRole() == ProjectRole.REVIEWER || membership.getRole() == ProjectRole.VIEWER;
    }
}
