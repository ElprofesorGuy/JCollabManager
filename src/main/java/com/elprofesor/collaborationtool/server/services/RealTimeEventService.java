package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.models.TaskEventDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RealTimeEventService {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishTaskEvent(UUID projectId, TaskEventDTO event) {
        messagingTemplate.convertAndSend("/topic/projects/" + projectId + "/tasks", event);
    }
}
