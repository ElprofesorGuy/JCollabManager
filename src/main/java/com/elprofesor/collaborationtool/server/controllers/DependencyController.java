package com.elprofesor.collaborationtool.server.controllers;

import com.elprofesor.collaborationtool.server.mapper.TaskDependencyMapper;
import com.elprofesor.collaborationtool.server.models.TaskDependencyRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskDependencyResponseDTO;
import com.elprofesor.collaborationtool.server.repositories.TaskDependencyRepository;
import com.elprofesor.collaborationtool.server.services.DependencyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class DependencyController {

    private final DependencyService dependencyService;
    private final TaskDependencyRepository dependencyRepository;
    private final TaskDependencyMapper dependencyMapper;

    @PostMapping("/api/v1/tasks/dependencies")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Créer une dépendance entre deux tâches")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "200", description = "Dépendence ajouté avec succès")
    })
    public ResponseEntity saveNewDependency(@RequestBody TaskDependencyRequestDTO dto){
        TaskDependencyResponseDTO response = dependencyService.addDependency(dto);
        HttpHeaders header = new HttpHeaders();
        header.add("Location", "/api/v1/tasks/dependencies/" + response.getDependencyId());
        return new ResponseEntity(HttpStatus.CREATED);
    }

    @DeleteMapping("/api/v1/tasks/dependencies/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Supprimer une dépendance entre deux tâches")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dépendance supprimée"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié")
    })
    public ResponseEntity deleteDependency(@PathVariable("id") UUID id){
        TaskDependencyRequestDTO dto = dependencyMapper.taskDependencyToTaskDependencyRequestDTO(
                dependencyRepository.findById(id).orElseThrow(() -> new NotFoundException("Dépendance inexistante"))
        );
        dependencyService.deleteDependency(dto);
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/api/v1/projects/{projectId}/dependencies")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister toutes les dépendances d'un projet")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des dépendances retournée avec succès"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "404", description = "Projet inexistant, vérifiez les informations du projet")
    })
    public List<TaskDependencyResponseDTO> getProjectDependencies(@PathVariable("projectId") UUID projectId){
        return dependencyService.getProjetDependencies(projectId);
    }

}
