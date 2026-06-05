package com.elprofesor.collaborationtool.server.repositories;

import com.elprofesor.collaborationtool.server.entities.Notification;
import com.elprofesor.collaborationtool.server.entities.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByDestinataire(Users currentUser);
    List<Notification> findByDestinataireAndIsReadIsFalse(Users currentUser);
}
