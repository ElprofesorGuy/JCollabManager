package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.models.ProjectRequestDTO;
import com.elprofesor.collaborationtool.server.models.ProjectResponseDTO;
import jakarta.validation.constraints.Email;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;


public interface ProjectService {
    List<ProjectResponseDTO> listProjects();
    Optional<ProjectResponseDTO> getProjectById(UUID id);
    ProjectResponseDTO saveNewProject(ProjectRequestDTO projectRequestDTO);
    Optional<ProjectRequestDTO> updateProjectById(UUID id, ProjectRequestDTO project);
    Boolean deleteProject(UUID id);
    Project getProjectByTitle(String keyword);
    public boolean isProjectOwner(UUID projectId, String email);

    ProjectResponseDTO addMembers(UUID projectId, Set<@Email String> memberEmails);
    public ProjectResponseDTO removeMembers(UUID projectId, Set<@Email String> memberEmails);
}
