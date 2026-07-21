package com.elprofesor.collaborationtool.server.mapper;

import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.models.TaskRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface TaskMapper {
    @Mapping(source = "assign_to", target = "assign_to.username")
    //@Mapping(source = "status.name", target = "workflowStatus")
    //@Mapping(source = "parentTaskName", target = "parentTask.title")
    Task taskRequestDtoToTask(TaskRequestDTO taskRequestDto);

    @Mapping(source = "assign_to.email", target = "assign_to")
    @Mapping(source = "status.name", target = "workflowStatus")
    TaskRequestDTO taskToTaskRequestDto(Task task);

    @Mapping(source = "assign_to", target = "assign_to.email")
    @Mapping(source = "projectName", target = "project.title")
    @Mapping(source = "parentTaskName", target = "parentTask.title")
    @Mapping(source = "workflowStatus", target = "status.name")
    Task taskResponseDtoToTask(TaskResponseDTO taskResponseDTO);

    @Mapping(source = "assign_to.email", target = "assign_to")
    @Mapping(source = "project.title", target = "projectName")
    @Mapping(source = "parentTask.title", target = "parentTaskName")
    TaskResponseDTO taskToTaskResponseDto(Task task);
}
