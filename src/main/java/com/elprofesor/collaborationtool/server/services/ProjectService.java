package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.models.ProjectDTO;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectService {
    List<ProjectDTO> listProjects();
    Optional<ProjectDTO> getProjectById(UUID id);
    ProjectDTO saveNewProject(ProjectDTO projectDTO);
    Optional<ProjectDTO> updateProjectById(UUID id, ProjectDTO project);
    Boolean deleteProject(UUID id);
    Project getProjectByTitle(String keyword);
    public boolean isProjectOwner(UUID projectId, String email);
}
