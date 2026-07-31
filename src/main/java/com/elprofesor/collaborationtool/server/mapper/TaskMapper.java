package com.elprofesor.collaborationtool.server.mapper;

import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.models.TaskRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface TaskMapper {
    @Mapping(source = "assignTo", target = "assignTo.username")
    Task taskRequestDtoToTask(TaskRequestDTO taskRequestDto);

    @Mapping(source = "assignTo.email", target = "assignTo")
    @Mapping(source = "status.name", target = "workflowStatus")
    TaskRequestDTO taskToTaskRequestDto(Task task);

    @Mapping(source = "assignTo", target = "assignTo.email")
    @Mapping(source = "projectName", target = "project.title")
    @Mapping(source = "parentTaskName", target = "parentTask.title")
    @Mapping(source = "workflowStatus", target = "status.name")
    Task taskResponseDtoToTask(TaskResponseDTO taskResponseDTO);

    @Mapping(source = "assignTo.email", target = "assignTo")
    @Mapping(source = "project.id", target = "projectId")
    @Mapping(source = "project.title", target = "projectName")
    @Mapping(source = "parentTask.title", target = "parentTaskName")
    @Mapping(source = "status.name", target = "workflowStatus")
    @Mapping(source = "status.completed", target = "isCompleted")
    TaskResponseDTO taskToTaskResponseDto(Task task);
}
