package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.mapper.ProjectMapper;
import com.elprofesor.collaborationtool.server.models.ProjectDTO;
import com.elprofesor.collaborationtool.server.repositories.ProjectRepository;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceJPA implements ProjectService {

    private final ProjectMapper projectMapper;
    private final ProjectRepository projectRepository;

    @Override
    public List<ProjectDTO> listProjects() {
        return projectRepository.findAll()
                .stream()
                .map(projectMapper::projectToProjectDto)
                .collect(Collectors.toList());
    }


    @Override
    public Optional<ProjectDTO> getProjectById(UUID id) {
        return Optional.of(projectMapper.projectToProjectDto(projectRepository.findById(id).orElseThrow(NotFoundException::new)));
    }

    @Override
    public ProjectDTO saveNewProject(ProjectDTO projectDTO) {
        return projectMapper.projectToProjectDto(projectRepository.save(projectMapper.projectDtoToProject(projectDTO)));
    }

    @Override
    public Optional<ProjectDTO> updateProjectById(UUID id, ProjectDTO projectDTO) {
        AtomicReference<Optional<ProjectDTO>> atomicReference = new AtomicReference<>();
        projectRepository.findById(id).ifPresentOrElse(foundProject -> {
            foundProject.setTitle(projectDTO.getTitle());
            foundProject.setDescription(projectDTO.getDescription());
            foundProject.setCreation_date(projectDTO.getCreation_date());
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
    public boolean isProjectOwner(UUID projectId, String email) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new  NotFoundException("Projet non trouvé"));
        return project.getOwner().getEmail().equals(email);
    }
}
