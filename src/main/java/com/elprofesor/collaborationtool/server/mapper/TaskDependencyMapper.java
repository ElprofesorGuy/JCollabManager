package com.elprofesor.collaborationtool.server.mapper;

import com.elprofesor.collaborationtool.server.entities.TaskDependency;
import com.elprofesor.collaborationtool.server.models.TaskDependencyRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskDependencyResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface TaskDependencyMapper {

    @Mapping(source = "predecessorId", target = "predecessor.id")
    @Mapping(source = "successorId", target = "successor.id")
    @Mapping(target = "taskDependencyId", ignore = true)
    TaskDependency dependencyDtoToTaskDependency(TaskDependencyRequestDTO dto);

    @Mapping(source = "predecessor.id", target = "predecessorId")
    @Mapping(source = "successor.id", target = "successorId")
    TaskDependencyRequestDTO taskDependencyToTaskDependencyRequestDTO(TaskDependency dependency);

    @Mapping(source = "predecessor.title", target = "predecessorTitle")
    @Mapping(source = "successor.title", target = "successorTitle")
    @Mapping(source = "taskDependencyId", target = "dependencyId")
    @Mapping(source = "predecessor.project.title", target = "projectName")
    @Mapping(source = "predecessor.id", target = "predecessorId")
    @Mapping(source = "successor.id", target = "successorId")
    TaskDependencyResponseDTO taskDependencyToTaskDependencyResponseDTO(TaskDependency dependency);
}
