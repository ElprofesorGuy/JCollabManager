package com.elprofesor.collaborationtool.server.controllers;

import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.models.ProjectRequestDTO;
import com.elprofesor.collaborationtool.server.models.ProjectResponseDTO;
import com.elprofesor.collaborationtool.server.models.TaskResponseDTO;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import com.elprofesor.collaborationtool.server.services.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProjectController {

    private final ProjectService projectService;
    private final UserRepository userRepository;
    private final String PROJECT_PATH = "/api/v1/project";
    private final String PROJECT_PATH_ID = PROJECT_PATH + "/{projectId}";

    @GetMapping(PROJECT_PATH)
    //@PreAuthorize("hasRole('ADMIN')")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Liste des projets", description = "Afficher la liste de tous les projets enregistrés")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Affichage de la liste des projets reussi"),
        @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié, veuillez d'abord vous connecter")
    })
    public List<ProjectResponseDTO> displayListProject(){
        return projectService.listProjects();
    }

    @GetMapping(PROJECT_PATH_ID)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Recherche d'un projet par son identifiant", description = "Rechercher un projet spécifique à l'aide de son identifiant")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "404", description = "Projet inexistant, vérifiez l'identifiant du projet"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié, opération non permise"),
            @ApiResponse(responseCode = "200", description = "Projet trouvé.")
    })
    public ProjectResponseDTO getProjectById(@PathVariable("projectId")UUID projectId){
        return projectService.getProjectById(projectId).orElseThrow(NotFoundException::new);
    }

    @PostMapping(PROJECT_PATH)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation (summary = "Création d'un nouveau projet", description = "Créer un nouveau projet")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié, opération non permise"),
            @ApiResponse(responseCode = "201", description = "Projet créé avec succès"),
            @ApiResponse(responseCode = "500", description = "Verrouillage optimiste : Le champ id doit être vide/supprimez-le ou email incorrecte, ne correspond à aucun utilisateur.")
    })
    public ResponseEntity saveNewProject(@RequestBody ProjectRequestDTO projectRequestDTO){
        ProjectResponseDTO newProject = projectService.saveNewProject(projectRequestDTO);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Location", PROJECT_PATH + "/" + newProject.getId());
        return new ResponseEntity(HttpStatus.CREATED);
    }

    @PutMapping(PROJECT_PATH_ID)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modification des informations d'un projet", description = "Modifier le titre | description | chef de projet")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "403", description = "Admin non authentifié"),
            @ApiResponse(responseCode = "204", description = "Informations de projet mises à jour"),
            @ApiResponse(responseCode = "404", description = "Projet inexistant, vérifiez l'identifiant du projet")
    })
    public ResponseEntity updateProject(@PathVariable("projectId") UUID projectId, @RequestBody ProjectRequestDTO projectUpToDate){
        projectService.updateProjectById(projectId, projectUpToDate);
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }

    @DeleteMapping(PROJECT_PATH_ID)
    @PreAuthorize("@projectService.isProjectOwner(#projectId, authentication.name)")
    @Operation(summary = "Suppression d'un projet", description = "Suppression d'un projet en fournissant son identifiant.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "404", description = "Ce projet a déjà été supprimé ou il est inexistant."),
            @ApiResponse(responseCode = "204", description = "Projet supprimé avec succès"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non authetifié.")
    })
    public ResponseEntity deleteProjectById(@PathVariable("projectId") UUID projectId){
        projectService.deleteProject(projectId);
        System.out.println("Id du projet à supprimer : " + projectId);
        //System.out.println("Principal Name : " + authentication.name);
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }

    @PostMapping("/projects/{projectId}/members")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Ajout des membres", description = "Ajouter les membres de l'équipe de projet, le owner est d'office un membre")
    public ResponseEntity<ProjectResponseDTO> addMembers(@PathVariable("projectId") UUID projectId,
                                                         @RequestBody Set<@Email String> memberEmails,
                                                         @AuthenticationPrincipal UserDetails userDetails) {

        Users currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();
        return ResponseEntity.ok(projectService.addMembers(projectId, memberEmails, currentUser));
    }

    @DeleteMapping("/projects/{projectId}/members")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Suppression des membres", description = "Exclure ou supprimer un membre de l'équipe, le owner ne pouvant être supprimé par lui même")
    public ResponseEntity<ProjectResponseDTO> removeMembers(
            @PathVariable UUID projectId,
            @RequestBody Set<@Email String> memberEmails,
            @AuthenticationPrincipal UserDetails userDetails) {
        Users currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        return ResponseEntity.ok(projectService.removeMembers(projectId, memberEmails, currentUser));
    }

    @GetMapping("/projects/{projectId}/members")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Affichage de la liste des membres", description = "Afficher l'ensemble des personnes travaillant sur un projet spécifique")
    public Set<Users> displayListofMembers(@PathVariable("projectId")UUID projectId){
        return projectService.displayMembersOfaProject(projectId);
    }

    @PostMapping("/projects/{projectId}/tasks")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Ajout d'une tâche", description = "Ajouter une tâche à un projet")
    public ResponseEntity<TaskResponseDTO> addTasks(@PathVariable("projectId") UUID projectId,
                                                    @RequestBody String taskTitle){
        return ResponseEntity.ok(projectService.addTaskToProject(projectId, taskTitle));
    }
}
