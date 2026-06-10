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
    TaskDependency dependencyDtoToTaskDependency(TaskDependencyRequestDTO dto);

    @Mapping(source = "predecessor.id", target = "predecessorId")
    @Mapping(source = "successor.id", target = "successorId")
    TaskDependencyRequestDTO taskDependencyToTaskDependencyRequestDTO(TaskDependency dependency);

    @Mapping(source = "predecessor.id", target = "predecessorId")
    @Mapping(source = "successor.id", target = "successorId")
    TaskDependencyResponseDTO taskDependencyToTaskDependencyResponseDTO(TaskDependency dependency);
}
