package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Notification;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.mapper.NotificationMapper;
import com.elprofesor.collaborationtool.server.models.NotificationRequestDTO;
import com.elprofesor.collaborationtool.server.models.NotificationResponseDTO;
import com.elprofesor.collaborationtool.server.repositories.NotificationRepository;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceJPA implements NotificationService {
    private final NotificationMapper notificationMapper;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate; // Injection de SimpMessagingTemplate
    private final UserRepository userRepository; // Injection de UserRepository

    @Override
    public NotificationResponseDTO saveNewNotification(NotificationRequestDTO notif) {
        Notification notifToSave = notificationMapper.notificationRequestDTOToNotification(notif);
        
        // Fetch the actual user from DB using the username to avoid transient exception
        //On vérifie d'abord que le destinatiare de la notification existe bel et bien en BD
        if (notif.getRecipientUsername() != null) {
             userRepository.findByUsername(notif.getRecipientUsername()).ifPresent(notifToSave::setDestinataire);
        }

        //notifToSave.setRead(false);
        Notification savedNotif = notificationRepository.save(notifToSave);
        NotificationResponseDTO responseDTO = notificationMapper.notificattionToNotificationResponseDTO(savedNotif);
        
        // Envoi en temps réel via WebSocket à l'utilisateur destinataire
        if (savedNotif.getDestinataire() != null && savedNotif.getDestinataire().getUsername() != null) {
            messagingTemplate.convertAndSendToUser(
                    savedNotif.getDestinataire().getUsername(),
                    "/queue/notifications",
                    responseDTO
            );
        }
        
        return responseDTO;
    }

    @Override
    public List<NotificationResponseDTO> getUserNotification(Users currentUsers) {
        return notificationRepository.findByDestinataire(currentUsers)
                .stream()
                .map(notificationMapper::notificattionToNotificationResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationResponseDTO> getUnreadNotification(Users currentUser) {
        return notificationRepository.findByDestinataireAndIsReadIsFalse(currentUser)
                .stream()
                .map(notificationMapper::notificattionToNotificationResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void markNotificationAsRead(UUID notifId) {
        Notification not = notificationRepository.findById(notifId)
                .orElseThrow(() -> new NotFoundException("Notification Inexistante"));
        not.setIsRead(true);
        notificationRepository.save(not);
    }

    @Override
    public void markAllNotificationsAsRead(Users currentUser) {
        // Correction de performance : On récupère uniquement les notifications non lues de l'utilisateur
        List<Notification> listOfNotif = notificationRepository.findByDestinataireAndIsReadIsFalse(currentUser);
        listOfNotif.forEach(notification -> {
            notification.setIsRead(true);
        });
        notificationRepository.saveAll(listOfNotif);

    }
}
