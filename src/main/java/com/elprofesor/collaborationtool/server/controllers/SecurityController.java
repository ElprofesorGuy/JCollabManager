package com.elprofesor.collaborationtool.server.controllers;

import com.elprofesor.collaborationtool.server.models.ProjectRequestDTO;
import com.elprofesor.collaborationtool.server.models.ProjectResponseDTO;
import com.elprofesor.collaborationtool.server.services.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/projects")
public class SecurityController {

    private final ProjectService projectService;

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ProjectResponseDTO>> getAllProjectsForAdmin() {
        return ResponseEntity.ok(projectService.listProjects());
    }

    // Un utilisateur ne peut supprimer un projet que s'il en est le créateur
    /*@DeleteMapping("/{id}")
    @PreAuthorize("@projectService.isProjectOwner(#id, authentication.name)")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }*/
}
