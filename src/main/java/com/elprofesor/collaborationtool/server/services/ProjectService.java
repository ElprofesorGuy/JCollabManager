package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.models.*;
import jakarta.validation.constraints.Email;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;


public interface ProjectService {
    Optional<ProjectResponseDTO> getProjectById(UUID id);
    ProjectResponseDTO saveNewProject(ProjectRequestDTO projectRequestDTO);
    Optional<ProjectRequestDTO> updateProjectById(UUID id, ProjectRequestDTO project);
    Boolean deleteProject(UUID id);
    List<ProjectResponseDTO> listProjects();
    List<ProjectResponseDTO> listMyProjects(UserDetails userDetails);
    ProjectResponseDTO addMembers(UUID projectId, String memberEmail, UserDetails userDetails, ProjectRole projectRole);
    ProjectResponseDTO removeMembers(UUID projectId, @Email String memberEmail);
    Set<ProjectMemberResponseDTO> displayMembersOfaProject(UUID projectId);
    /*TaskResponseDTO addTaskToProject(UUID projectId, TaskRequestDTO taskRequestDTO);*/
    ProjectResponseDTO removeTask(UUID projectId, String taskTitle);

    Set<TaskResponseDTO> listOfTasks(UUID projectId);
}
