package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.mapper.ProjectMapper;
import com.elprofesor.collaborationtool.server.models.ProjectRequestDTO;
import com.elprofesor.collaborationtool.server.repositories.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service("projectService")
@RequiredArgsConstructor
public class ProjectServiceJPA implements ProjectService {

    private final ProjectMapper projectMapper;
    private final ProjectRepository projectRepository;

    @Override
    public List<ProjectRequestDTO> listProjects() {
        return projectRepository.findAll()
                .stream()
                .map(projectMapper::projectToProjectDto)
                .collect(Collectors.toList());
    }


    @Override
    public Optional<ProjectRequestDTO> getProjectById(UUID id) {
        return Optional.of(projectMapper.projectToProjectDto(projectRepository.findById(id).orElseThrow(NotFoundException::new)));
    }

    @Override
    public ProjectRequestDTO saveNewProject(ProjectRequestDTO projectRequestDTO) {
        return projectMapper.projectToProjectDto(projectRepository.save(projectMapper.projectDtoToProject(projectRequestDTO)));
    }

    @Override
    public Optional<ProjectRequestDTO> updateProjectById(UUID id, ProjectRequestDTO projectRequestDTO) {
        AtomicReference<Optional<ProjectRequestDTO>> atomicReference = new AtomicReference<>();
        projectRepository.findById(id).ifPresentOrElse(foundProject -> {
            foundProject.setTitle(projectRequestDTO.getTitle());
            foundProject.setDescription(projectRequestDTO.getDescription());
            foundProject.setCreation_date(projectRequestDTO.getCreation_date());
            Project savedProject = projectRepository.save(foundProject);
            atomicReference.set(Optional.of(projectMapper.projectToProjectDto(savedProject)));
        }, () -> {
            atomicReference.set(Optional.empty());
        });
        return atomicReference.get();
    }

    @Override
    public Boolean deleteProject(UUID id) {
        if(projectRepository.existsById(id)){
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
    public boolean isProjectOwner(UUID projectId, String name) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new  NotFoundException("Projet non trouvé"));
        System.out.println("Owner du projet trouvé : " + project.getOwner().getUsername());
        System.out.println("Owner du projet attendu : " + name);
        return project.getOwner().getUsername().equals(name);
    }
}
