package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.models.*;
import jakarta.validation.constraints.Email;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;


public interface ProjectService {
    Optional<ProjectResponseDTO> getProjectById(UUID id);
    ProjectResponseDTO saveNewProject(ProjectRequestDTO projectRequestDTO);
    Optional<ProjectRequestDTO> updateProjectById(UUID id, ProjectRequestDTO project, Users currentUser);
    Boolean deleteProject(UUID id);
    Project getProjectByTitle(String keyword);
    public boolean isProjectOwner(UUID projectId, String email);
    List<ProjectResponseDTO> listProjects();
    List<ProjectResponseDTO> listMyProjects(Users currentUser);
    ProjectResponseDTO addMembers(UUID projectId, Set<@Email String> memberEmails, Users currentUser);
    ProjectResponseDTO removeMembers(UUID projectId, Set<@Email String> memberEmails, Users currentUser);
    Set<UserResponseDTO> displayMembersOfaProject(UUID projectId);
    /*TaskResponseDTO addTaskToProject(UUID projectId, TaskRequestDTO taskRequestDTO);*/
    ProjectResponseDTO removeTask(UUID projectId, String taskTitle, Users currentUser);

    Set<TaskResponseDTO> listOfTasks(UUID projectId);
}
