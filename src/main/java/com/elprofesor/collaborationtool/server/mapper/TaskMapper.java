package com.elprofesor.collaborationtool.server.mapper;

import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.models.TaskDTO;
import org.mapstruct.Mapper;

@Mapper
public interface TaskMapper {
    Task taskDtoToTask(TaskDTO taskDto);
    TaskDTO taskToTaskDto(Task task);
}
