package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.models.TaskRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskResponseDTO;
import org.springframework.data.domain.Page;
import java.util.Optional;
import java.util.UUID;


public interface TaskService {
    Optional<TaskResponseDTO> getTask(UUID id);
    TaskResponseDTO saveNewTask(UUID projectId, TaskRequestDTO taskRequestDTO, Users currentUser);
    Optional<TaskRequestDTO> updateTask(UUID id, TaskRequestDTO taskRequestDTO, Users currentUser);
    Boolean deleteTask(UUID id, Users currentUser);
    //List<TaskResponseDTO> listOverdueTask();
    Page<TaskResponseDTO> listOfTasks(String taskTitle, String statusName, Integer pageNumber, Integer pageSize);
    //TaskResponseDTO uploadAttachment(UUID taskId, MultipartFile file, Users currentUser);
    //TaskResponseDTO removeAttachment(UUID taskId, Users currentUser);
    boolean isPredecessorsAllCompleted(Task task);
}
