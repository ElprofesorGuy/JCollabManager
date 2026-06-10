package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.entities.TaskDependency;
import com.elprofesor.collaborationtool.server.mapper.TaskDependencyMapper;
import com.elprofesor.collaborationtool.server.models.TaskDependencyRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskDependencyResponseDTO;
import com.elprofesor.collaborationtool.server.repositories.TaskDependencyRepository;
import com.elprofesor.collaborationtool.server.repositories.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DependencyServiceJPA implements DependencyService{

    private final TaskRepository taskRepository;
    private final TaskDependencyRepository dependencyRepository;
    private final TaskDependencyMapper dependencyMapper;

    @Override
    public TaskDependencyResponseDTO addDependency(TaskDependencyRequestDTO dependencyRequestDTO){
        Task pred = taskRepository.findById(dependencyRequestDTO.getPredecessorId()).orElseThrow(() -> new NotFoundException("Tâche inexistante"));
        Task succ = taskRepository.findById(dependencyRequestDTO.getSuccessorId()).orElseThrow(() -> new NotFoundException("Tâche inexistante"));
        TaskDependency savedTaskDependency = TaskDependency.builder()
                .predecessor(pred)
                .successor(succ)
                .build();
        dependencyRepository.save(savedTaskDependency);

        return dependencyMapper.taskDependencyToTaskDependencyResponseDTO(savedTaskDependency);
    }

    @Override
    public boolean deleteDependency(TaskDependencyRequestDTO dependencyRequestDTO){
        TaskDependency deletedDependency = dependencyMapper.dependencyDtoToTaskDependency(dependencyRequestDTO);
        if(dependencyRepository.existsById(deletedDependency.getTaskDependencyId())){
            dependencyRepository.delete(deletedDependency);
            return true;
        }
        return false;
    }

    @Override
    public List<TaskDependencyResponseDTO> getProjetDependencies() {
        return dependencyRepository.findAll()
                .stream()
                .map(dependencyMapper::taskDependencyToTaskDependencyResponseDTO)
                .collect(Collectors.toList());
    }
}
