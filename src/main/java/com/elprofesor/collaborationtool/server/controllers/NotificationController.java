package com.elprofesor.collaborationtool.server.controllers;


import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.models.NotificationResponseDTO;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import com.elprofesor.collaborationtool.server.services.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final String NOTIFICATION_PATH = "/api/notifications";
    private final String NOTIFICATION_PATH_ID = NOTIFICATION_PATH + "/{notificationId}";

    @GetMapping(NOTIFICATION_PATH)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Liste des notifications", description = "Retourne la liste des notifications d'un utilisateur spécifique")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "404", description = "Utilisateur non trouvé"),
            @ApiResponse(responseCode = "200", description = "Liste des notifications retournée avec succès")
    })
    public List<NotificationResponseDTO> getUserNotifications(@AuthenticationPrincipal UserDetails userDetails){
        Users currentUser = userRepository.findByUsername(userDetails.getUsername()).orElseThrow(() -> new NotFoundException("Not Found User"));
        return notificationService.getUserNotification(currentUser);
    }

    @GetMapping(NOTIFICATION_PATH + "/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Liste des notifications non lues", description = "Retourne la liste des notifications non lues")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des notifications non lues retournée avec succès"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié")
    })
    public Integer getUnreadNotificationsCount(@AuthenticationPrincipal UserDetails userDetails){
        Users currentUser = userRepository.findByUsername(userDetails.getUsername()).orElseThrow(() -> new NotFoundException("Not Found User"));
        return notificationService.getUnreadNotification(currentUser).size();

    }

    @PutMapping(NOTIFICATION_PATH_ID + "/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lire une notification", description = "Marquer une notification comme lue")
    public ResponseEntity markNotificationAsRead(@PathVariable("notificationId") UUID notificationId){
        notificationService.markNotificationAsRead(notificationId);
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }

    @PutMapping(NOTIFICATION_PATH + "/read-all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Marquer les notificattions comme lues")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notifications marquées comme lues"),
            @ApiResponse(responseCode = "403", description = "Utilisateur non authentifié")
    })
    public ResponseEntity markAllNotificationsAsRead(@AuthenticationPrincipal UserDetails userDetails){
        Users currentUser = userRepository.findByUsername(userDetails.getUsername()).orElseThrow(() -> new NotFoundException("Not Found User"));
        notificationService.markAllNotificationsAsRead(currentUser);
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }
}
