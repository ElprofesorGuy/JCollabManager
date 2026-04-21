package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.models.ProjectRequestDTO;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectService {
    List<ProjectRequestDTO> listProjects();
    Optional<ProjectRequestDTO> getProjectById(UUID id);
    ProjectRequestDTO saveNewProject(ProjectRequestDTO projectRequestDTO);
    Optional<ProjectRequestDTO> updateProjectById(UUID id, ProjectRequestDTO project);
    Boolean deleteProject(UUID id);
    Project getProjectByTitle(String keyword);
    public boolean isProjectOwner(UUID projectId, String email);

}
