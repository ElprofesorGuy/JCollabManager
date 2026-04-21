package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.mapper.ProjectMapper;
import com.elprofesor.collaborationtool.server.models.ProjectRequestDTO;
import com.elprofesor.collaborationtool.server.models.ProjectResponseDTO;
import com.elprofesor.collaborationtool.server.repositories.ProjectRepository;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service("projectService")
@RequiredArgsConstructor
@Validated
public class ProjectServiceJPA implements ProjectService {

    private final ProjectMapper projectMapper;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Override
    public List<ProjectResponseDTO> listProjects() {
        return projectRepository.findAll()
                .stream()
                .map(projectMapper::projectToProjectResponseDto)
                .collect(Collectors.toList());
    }


    @Override
    public Optional<ProjectResponseDTO> getProjectById(UUID id) {
        return Optional.of(projectMapper.projectToProjectResponseDto(projectRepository.findById(id).orElseThrow(NotFoundException::new)));
    }

    @Override
    public ProjectResponseDTO saveNewProject(ProjectRequestDTO projectRequestDTO) {
        Optional<Users> user= userRepository.findByEmail(projectRequestDTO.getOwnerEmail());
        Project projectToSave = projectMapper.projectRequestDtoToProject(projectRequestDTO);
        projectToSave.setOwner(user.get());
        projectToSave.addMember(user.get());
        return projectMapper.projectToProjectResponseDto(projectRepository.save(projectToSave));
    }

    @Override
    public Optional<ProjectRequestDTO> updateProjectById(UUID id, ProjectRequestDTO projectRequestDTO) {
        AtomicReference<Optional<ProjectRequestDTO>> atomicReference = new AtomicReference<>();
        projectRepository.findById(id).ifPresentOrElse(foundProject -> {
            foundProject.setTitle(projectRequestDTO.getTitle());
            foundProject.setDescription(projectRequestDTO.getDescription());
            foundProject.setOwner(userRepository.findByEmail(projectRequestDTO.getOwnerEmail()).get());
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

    @Override
    public ProjectResponseDTO addMembers(UUID projectId, Set<@Email String> memberEmails) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException(
                        "Projet introuvable : " + projectId
                ));

        // 2. Résoudre les emails en entités User
        Set<Users> newMembers = memberEmails.stream()
                .map(email -> userRepository.findByEmail(email)
                        .orElseThrow(() -> new NotFoundException(
                                "Utilisateur introuvable : " + email
                        )))
                .collect(Collectors.toSet());
        // 3. Ajouter les nouveaux membres au Set existant
        project.getMembers().addAll(newMembers);
        // 4. Sauvegarder et retourner
        return projectMapper.projectToProjectResponseDto(projectRepository.save(project));
    }

    @Override
    public ProjectResponseDTO removeMembers(UUID projectId, Set<@Email String> memberEmails) {

        // 1. Récupérer le projet
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException(
                        "Projet introuvable : " + projectId
                ));

        // 2. Résoudre les emails en entités User
        Set<Users> membersToRemove = memberEmails.stream()
                .map(email -> userRepository.findByEmail(email)
                        .orElseThrow(() -> new NotFoundException(
                                "Utilisateur introuvable : " + email
                        )))
                .collect(Collectors.toSet());

        // 3. Empêcher la suppression du owner
        if (membersToRemove.contains(project.getOwner())) {
            throw new IllegalArgumentException(
                    "Impossible de retirer le owner du projet"
            );
        }

        // 4. Retirer les membres du Set existant
        project.getMembers().removeAll(membersToRemove);

        return projectMapper.projectToProjectResponseDto(projectRepository.save(project));
    }
}
