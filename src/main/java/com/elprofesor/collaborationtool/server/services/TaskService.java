package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.models.TaskDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface TaskService {
    List<TaskDTO> listTask();
    Optional<TaskDTO> getTask(UUID id);
    TaskDTO saveNewTask(TaskDTO taskDTO);
    Optional<TaskDTO> updateTask(UUID id, TaskDTO taskDTO);
    Boolean deleteTask(UUID id);
}
