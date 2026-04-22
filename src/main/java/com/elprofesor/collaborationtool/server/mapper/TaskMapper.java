package com.elprofesor.collaborationtool.server.mapper;

import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.models.TaskRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface TaskMapper {
    @Mapping(source = "assign_to", target = "assign_to.username")
    Task taskRequestDtoToTask(TaskRequestDTO taskRequestDto);

    @Mapping(source = "assign_to.username", target = "assign_to")
    TaskRequestDTO taskToTaskRequestDto(Task task);

    @Mapping(source = "assign_to", target = "assign_to.username")
    @Mapping(source = "projectName", target = "project.title")
    Task taskResponseDtoToTask(TaskResponseDTO taskResponseDTO);

    @Mapping(source = "assign_to.username", target = "assign_to")
    @Mapping(source = "project.title", target = "projectName")
    TaskResponseDTO taskToTaskResponseDto(Task task);
}
