package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.models.NotificationRequestDTO;
import com.elprofesor.collaborationtool.server.models.NotificationResponseDTO;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    NotificationResponseDTO saveNewNotification(NotificationRequestDTO notif);
    List<NotificationResponseDTO> getUserNotification(Users currentUsers);

    List<NotificationResponseDTO> getUnreadNotification(Users currentUser);

    void markNotificationAsRead(UUID notifId);

    void markAllNotificationsAsRead(Users currentUser);
}
