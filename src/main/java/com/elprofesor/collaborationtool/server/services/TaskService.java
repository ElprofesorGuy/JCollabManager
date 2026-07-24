package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.models.TaskRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskResponseDTO;
import org.springframework.data.domain.Page;
import java.util.Optional;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;


public interface TaskService {
    Optional<TaskResponseDTO> getTask(UUID id);
    TaskResponseDTO saveNewTask(UUID projectId, TaskRequestDTO taskRequestDTO);
    Optional<TaskRequestDTO> updateTask(UUID id, TaskRequestDTO taskRequestDTO);
    void deleteTask(UUID id);
    Page<TaskResponseDTO> listOfTasks(String taskTitle, String statusName, Integer pageNumber, Integer pageSize);
    TaskResponseDTO uploadAttachment(UUID taskId, MultipartFile file);
    TaskResponseDTO removeAttachment(UUID taskId);
    boolean isPredecessorsAllCompleted(Task task);
}
