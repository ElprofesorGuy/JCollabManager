package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.*;
import com.elprofesor.collaborationtool.server.exception.WorkflowTransitionForbiddenException;
import com.elprofesor.collaborationtool.server.models.ProjectRole;
import com.elprofesor.collaborationtool.server.models.SystemRole;
import com.elprofesor.collaborationtool.server.models.WorkflowTransitionRequestDTO;
import com.elprofesor.collaborationtool.server.models.WorkflowTransitionResponseDTO;
import com.elprofesor.collaborationtool.server.repositories.ProjectMembershipRepository;
import com.elprofesor.collaborationtool.server.repositories.ProjectRepository;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import com.elprofesor.collaborationtool.server.repositories.WorkflowStatusRepository;
import com.elprofesor.collaborationtool.server.repositories.WorkflowTransitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkflowTransitionServiceJPA implements WorkflowTransitionService {

    private final WorkflowTransitionRepository workflowTransitionRepository;
    private final WorkflowStatusRepository workflowStatusRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMembershipRepository projectMembershipRepository;
    private final UserRepository userRepository;

    @Override
    public WorkflowTransitionResponseDTO addTransition(UUID projectId, WorkflowTransitionRequestDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Projet inexistant"));
        WorkflowStatus fromStatus = getProjectStatus(dto.getFromStatusId(), projectId);
        WorkflowStatus toStatus = getProjectStatus(dto.getToStatusId(), projectId);

        WorkflowTransition transition = WorkflowTransition.builder()
                .project(project)
                .fromStatus(fromStatus)
                .toStatus(toStatus)
                .name(dto.getName())
                .requiredRole(dto.getRequiredRole())
                .build();

        return toResponseDto(workflowTransitionRepository.save(transition));
    }

    @Override
    public WorkflowTransitionResponseDTO updateTransition(UUID projectId, UUID transitionId, WorkflowTransitionRequestDTO dto) {
        WorkflowTransition transition = workflowTransitionRepository.findById(transitionId)
                .orElseThrow(() -> new NotFoundException("Transition inexistante"));
        if (!transition.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("La transition ne correspond pas au projet");
        }

        if (dto.getFromStatusId() != null) {
            transition.setFromStatus(getProjectStatus(dto.getFromStatusId(), projectId));
        }
        if (dto.getToStatusId() != null) {
            transition.setToStatus(getProjectStatus(dto.getToStatusId(), projectId));
        }
        transition.setName(dto.getName());
        transition.setRequiredRole(dto.getRequiredRole());

        return toResponseDto(workflowTransitionRepository.save(transition));
    }

    @Override
    public List<WorkflowTransitionResponseDTO> listTransitions(UUID projectId) {
        return workflowTransitionRepository.findByProjectId(projectId)
                .stream()
                .map(this::toResponseDto)
                .toList();
    }

    @Override
    public List<WorkflowTransitionResponseDTO> listAllowedTransitions(UUID projectId, UUID fromStatusId) {
        return workflowTransitionRepository.findByProjectIdAndFromStatusId(projectId, fromStatusId)
                .stream()
                .filter(this::currentUserCanTrigger)
                .map(this::toResponseDto)
                .toList();
    }

    @Override
    public void deleteTransition(UUID projectId, UUID transitionId) {
        WorkflowTransition transition = workflowTransitionRepository.findById(transitionId)
                .orElseThrow(() -> new NotFoundException("Transition inexistante"));
        if (!transition.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("La transition ne correspond pas au projet");
        }
        workflowTransitionRepository.delete(transition);
    }

    @Override
    public void validateTransition(Task task, WorkflowStatus targetStatus) {
        WorkflowStatus currentStatus = task.getStatus();
        if (currentStatus == null || targetStatus == null || currentStatus.getId().equals(targetStatus.getId())) {
            return;
        }

        UUID projectId = task.getProject().getId();
        WorkflowTransition transition = workflowTransitionRepository
                .findByProjectIdAndFromStatusAndToStatus(projectId, currentStatus, targetStatus)
                .orElseThrow(() -> new WorkflowTransitionForbiddenException(
                        "Transition non autorisee : " + currentStatus.getName() + " -> " + targetStatus.getName()));

        if (!currentUserCanTrigger(transition)) {
            throw new WorkflowTransitionForbiddenException("Role insuffisant pour declencher cette transition");
        }
    }

    private WorkflowStatus getProjectStatus(UUID statusId, UUID projectId) {
        WorkflowStatus status = workflowStatusRepository.findById(statusId)
                .orElseThrow(() -> new NotFoundException("Statut inexistant"));
        if (status.getProject() == null || !status.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Le statut ne correspond pas au projet");
        }
        return status;
    }

    //
    private boolean currentUserCanTrigger(WorkflowTransition transition) {
        Users currentUser = getCurrentUser();
        if (currentUser.getRole() == SystemRole.ADMIN) return true;

        ProjectMembership membership = projectMembershipRepository
                .findByProjectIdAndUserId(transition.getProject().getId(), currentUser.getId());
        if (membership == null) return false;
        if (membership.getRole() == ProjectRole.MANAGER) return true;
        if (transition.getRequiredRole() == null) return membership.getRole() != ProjectRole.VIEWER;

        return membership.getRole() == transition.getRequiredRole();
    }

    private Users getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails user = (UserDetails) authentication.getPrincipal();
        return userRepository.findByUsername(user.getUsername())
                .orElseThrow(() -> new NotFoundException("Utilisateur inexistant"));
    }

    private WorkflowTransitionResponseDTO toResponseDto(WorkflowTransition transition) {
        return WorkflowTransitionResponseDTO.builder()
                .id(transition.getId())
                .projectId(transition.getProject().getId())
                .fromStatusId(transition.getFromStatus().getId())
                .fromStatusName(transition.getFromStatus().getName())
                .toStatusId(transition.getToStatus().getId())
                .toStatusName(transition.getToStatus().getName())
                .name(transition.getName())
                .requiredRole(transition.getRequiredRole())
                .build();
    }
}
