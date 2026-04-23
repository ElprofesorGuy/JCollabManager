package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.models.TaskRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskResponseDTO;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface TaskService {
    List<TaskResponseDTO> listTask();
    Optional<TaskResponseDTO> getTask(UUID id);
    TaskResponseDTO saveNewTask(UUID projectId, TaskRequestDTO taskRequestDTO, Users currentUser);
    Optional<TaskRequestDTO> updateTask(UUID id, TaskRequestDTO taskRequestDTO, Users currentUser);
    Boolean deleteTask(UUID id, Users currentUser);
}
