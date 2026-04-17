package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.mapper.TaskMapper;
import com.elprofesor.collaborationtool.server.mapper.UserMapper;
import com.elprofesor.collaborationtool.server.models.TaskDTO;
import com.elprofesor.collaborationtool.server.repositories.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceJPA implements TaskService {

    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final UserMapper userMapper;

    @Override
    public List<TaskDTO> listTask() {
        return taskRepository.findAll()
                .stream()
                .map(taskMapper::taskToTaskDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<TaskDTO> getTask(UUID id) {
        return Optional.ofNullable(taskMapper.taskToTaskDto(taskRepository.findById(id).orElseThrow(NotFoundException::new)));
    }

    @Override
    public TaskDTO saveNewTask(TaskDTO taskDTO) {
        return taskMapper.taskToTaskDto(taskRepository.save(taskMapper.taskDtoToTask(taskDTO)));
    }

    @Override
    public Optional<TaskDTO> updateTask(UUID id, TaskDTO taskDTO) {

        taskRepository.findById(id).map(foundTask -> {
            foundTask.setTitle(taskDTO.getTitle());
            foundTask.setStatus(taskDTO.getStatus());
            foundTask.setDescription(taskDTO.getDescription());
            foundTask.setAssign_to(userMapper.userResponseDtoToUser(taskDTO.getAssign_to()));
            foundTask.setCreation_date(taskDTO.getCreation_date());
            Task savedTask = taskRepository.save(foundTask);
            return savedTask;
        });
        return Optional.empty();
    }

    @Override
    public Boolean deleteTask(UUID id) {
        if(taskRepository.existsById(id)){
            taskRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
