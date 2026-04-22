package com.elprofesor.collaborationtool.server.controllers;

import com.elprofesor.collaborationtool.server.models.TaskRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskResponseDTO;
import com.elprofesor.collaborationtool.server.services.TaskService;
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
@CrossOrigin(origins = "*")
public class TaskController {
    private final TaskService taskService;
    private final String TASK_PATH = "/api/v1/task";
    private final String TASK_PATH_ID = TASK_PATH + "/{taskId}";

    @GetMapping(TASK_PATH)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Liste des tâches", description = "Lister l'ensemble des tâches, indépendamment des projets")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié, veuillez d'abord vous connecter"),
            @ApiResponse(responseCode = "200", description = "Liste des tâches chargée avec succès")
    })
    public List<TaskResponseDTO> displayListOfTasks(){
        return taskService.listTask();
    }

    @GetMapping(TASK_PATH_ID)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Recherche une tâche spécifique", description = "Rechercher dans la BD une tâche particulière en fournissant sont ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "404", description = "Cette tâche n'existe pas."),
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentigié, veuillez d'abord vous connecter"),
            @ApiResponse(responseCode = "200", description = "Tâche trouvée")
    })
    public TaskResponseDTO getTask(@PathVariable("taskId") UUID taskId){
        return taskService.getTask(taskId).orElseThrow(NotFoundException::new);
    }

    @DeleteMapping(TASK_PATH_ID)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Suppression d'une tâche", description = "Supprimer une tâche spécifique d'un projet")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentigié, veuillez d'abord vous connecter"),
            @ApiResponse(responseCode = "404", description = "Tâche inexsitante"),
            @ApiResponse(responseCode = "200", description = "Tâache supprimée")
    })
    public ResponseEntity deleteTask(@PathVariable("taskId") UUID taskId){
        if(! taskService.deleteTask(taskId)){
            throw new NotFoundException();
        }
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }

    @PostMapping(TASK_PATH)
    @Operation (summary = "Création d'une nouvelle tâche", description = "Créer une nouvelle tâche")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié, opération non permise"),
            @ApiResponse(responseCode = "201", description = "Tâche créée avec succès"),
            @ApiResponse(responseCode = "500", description = "Verrouillage optimiste : Le champ id doit être vide/supprimez-le.")
    })
    public ResponseEntity saveNewTask(@RequestBody TaskRequestDTO taskRequestDTO){
        TaskResponseDTO newTask = taskService.saveNewTask(taskRequestDTO);
        HttpHeaders header = new HttpHeaders();
        header.add("Location", "/api/v1/task/" + newTask.getId());
        return new ResponseEntity(HttpStatus.CREATED);
    }

    @PutMapping(TASK_PATH_ID)
    @Operation(summary = "Modification des informations d'une tâche ", description = "Modifier les informations d'une tâche")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié"),
            @ApiResponse(responseCode = "204", description = "Informations de la tâche  mises à jour"),
            @ApiResponse(responseCode = "404", description = "Tâche inexistante, vérifiez l'identifiant de la tâche")
    })
    public ResponseEntity updateExistingTask(@PathVariable UUID taskId, @RequestBody TaskRequestDTO taskRequestDTO){
        if(taskService.updateTask(taskId, taskRequestDTO).isEmpty()){
            throw new NotFoundException();
        }
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }
}
