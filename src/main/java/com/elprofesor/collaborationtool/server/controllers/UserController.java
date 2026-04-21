package com.elprofesor.collaborationtool.server.controllers;


import com.elprofesor.collaborationtool.server.models.UserRequestDTO;
import com.elprofesor.collaborationtool.server.models.UserResponseDTO;
import com.elprofesor.collaborationtool.server.services.UserService;
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
public class UserController {

    private final UserService userService;
    private final String USER_PATH = "/api/v1/user";
    private final String USER_PATH_ID = "/api/v1/user/{userId}";

    @GetMapping(USER_PATH)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Affichage de la liste d'utilisateurs", description = "Afficher la liste de tous les membres de l'équipe de projet y compris l'admin.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié, aucune opération permise.")
    })
    public List<UserResponseDTO> getListUsers(){
        return userService.getUsersList();
    }

    @GetMapping(USER_PATH_ID)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Rechercher un projet spécifique", description = "Recherche dans la BD un utilisateur spécifique via son UUID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié, aucune opération permise."),
            @ApiResponse(responseCode = "404", description = "Utilisateur non présent en BD, vérifiez l'UUID que vous avez fourni")
    })
    public UserResponseDTO getSpecificUser(@PathVariable UUID userId){
        return userService.getUser(userId).orElseThrow(NotFoundException::new);
    }

    @PostMapping(USER_PATH)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer un utilisateur", description="Crée un utilisateur qui représente un membre de l'équipe de projet.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Utilisé créé avec succès."),
            @ApiResponse(responseCode = "403", description = "Opération non autorisée, seul un admin peut créer un nouvel utilisateur"),
            @ApiResponse(responseCode = "500", description = "Verrouillage optimiste : une autre transaction tente d'effectuer une modification")
    })
    public ResponseEntity saveNewUser(@RequestBody UserRequestDTO userRequestDTO){
        UserRequestDTO newUser = userService.saveNewUser(userRequestDTO);
        HttpHeaders header = new HttpHeaders();
        header.add("Location", "/api/v1/user/" + newUser.getId());
        return new ResponseEntity(header, HttpStatus.CREATED);
    }

    @DeleteMapping(USER_PATH_ID)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Suppression d'un utilisateur", description = "Supprimer un utilisateur en fournissant son ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "404", description = "Utitlisateur non trouvé en BD, vérifiez l'UUID que vous avez renseigné"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié, impossible d'effectuer cette tâche/ Seul un admin peut effectuer cette opération"),
            @ApiResponse(responseCode = "200", description = "Utilisateur supprimé avec succès")
    })
    public ResponseEntity deleteUser(@PathVariable("userId") UUID userId){
        if(!userService.deleteUser(userId)){
            throw new NotFoundException();
        }
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }

    @PutMapping(USER_PATH_ID)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mettre à jour un utilisateur", description = "Met à jour les données et renvoie un statut 204 si réussi.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Utilisateur mis à jour"),
            @ApiResponse(responseCode = "404", description = "Utilisateur non trouvé en base")
    })
    public ResponseEntity updateExistingUser(@RequestBody UserRequestDTO userResponseDTO, @PathVariable("userId") UUID userId){
        if(userService.updateUser(userResponseDTO, userId).isEmpty()){
            throw new NotFoundException();
        }
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }
}
