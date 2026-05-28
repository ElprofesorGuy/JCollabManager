package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.models.Status;
import com.elprofesor.collaborationtool.server.models.TaskRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface TaskService {
    Optional<TaskResponseDTO> getTask(UUID id);
    TaskResponseDTO saveNewTask(UUID projectId, TaskRequestDTO taskRequestDTO, Users currentUser);
    Optional<TaskRequestDTO> updateTask(UUID id, TaskRequestDTO taskRequestDTO, Users currentUser);
    Boolean deleteTask(UUID id, Users currentUser);
    List<TaskResponseDTO> listOverdueTask();
    Page<TaskResponseDTO> listOfTasks(String taskTitle, Status status, Integer pageNumber, Integer pageSize);
    TaskResponseDTO uploadAttachment(UUID taskId, MultipartFile file, Users currentUser);
    TaskResponseDTO removeAttachment(UUID taskId, Users currentUser);
}
