package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.models.TaskDependencyRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskDependencyResponseDTO;

import java.util.List;

public interface DependencyService {
    TaskDependencyResponseDTO addDependency(TaskDependencyRequestDTO dependencyRequestDTO);
    boolean deleteDependency(TaskDependencyRequestDTO dependencyRequestDTO);
    List<TaskDependencyResponseDTO> getProjetDependencies();
}
