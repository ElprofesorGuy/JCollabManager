package com.elprofesor.collaborationtool.server.mapper;

import com.elprofesor.collaborationtool.server.entities.Notification;
import com.elprofesor.collaborationtool.server.models.NotificationRequestDTO;
import com.elprofesor.collaborationtool.server.models.NotificationResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface NotificationMapper {
    @Mapping(source = "recipientUsername", target = "destinataire.username")
    Notification notificationRequestDTOToNotification(NotificationRequestDTO notifDTO);

    @Mapping(source = "destinataire.username", target = "recipientUsername")
    NotificationRequestDTO notificationToNotificationDTO(Notification notif);

    @Mapping(source = "destinataire.username", target = "recipientUsername")
    NotificationResponseDTO notificattionToNotificationResponseDTO(Notification notif);
}
