package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.mapper.TaskMapper;
import com.elprofesor.collaborationtool.server.mapper.UserMapper;
import com.elprofesor.collaborationtool.server.models.ProjectRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskResponseDTO;
import com.elprofesor.collaborationtool.server.repositories.ProjectRepository;
import com.elprofesor.collaborationtool.server.repositories.TaskRepository;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
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
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    @Override
    public List<TaskResponseDTO> listTask() {
        return taskRepository.findAll()
                .stream()
                .map(taskMapper::taskToTaskResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<TaskResponseDTO> getTask(UUID id) {
        return Optional.ofNullable(taskMapper.taskToTaskResponseDto(taskRepository.findById(id).orElseThrow(NotFoundException::new)));
    }

    @Override
    public TaskResponseDTO saveNewTask(TaskRequestDTO taskRequestDTO) {
        Task taskTosave = taskMapper.taskRequestDtoToTask(taskRequestDTO);
        taskTosave.setProject(projectRepository.findByTitleContainingIgnoreCase(taskRequestDTO.getProjectName()));
        taskTosave.setAssign_to(userRepository.findByUsername(taskRequestDTO.getAssign_to()).get());
        return taskMapper.taskToTaskResponseDto(taskRepository.save(taskTosave));
    }

    @Override
    public Optional<TaskRequestDTO> updateTask(UUID id, TaskRequestDTO taskRequestDTO) {

        AtomicReference<Optional<TaskRequestDTO>> atomicReference = new AtomicReference<>();
        taskRepository.findById(id).ifPresentOrElse(foundTask -> {
            foundTask.setTitle(taskRequestDTO.getTitle());
            foundTask.setStatus(taskRequestDTO.getStatus());
            foundTask.setDescription(taskRequestDTO.getDescription());
            foundTask.setAssign_to(userRepository.findByUsername(taskRequestDTO.getAssign_to()).get());
            Task savedTask = taskRepository.save(foundTask);
            atomicReference.set(Optional.of(taskMapper.taskToTaskRequestDto(savedTask)));
        }, () -> {
            atomicReference.set(Optional.empty());
        });
        return atomicReference.get();
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
