package com.elprofesor.collaborationtool.server.mapper;

import com.elprofesor.collaborationtool.server.entities.Sprint;
import com.elprofesor.collaborationtool.server.models.SprintRequestDTO;
import com.elprofesor.collaborationtool.server.models.SprintResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SprintMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "project", ignore = true)
    @Mapping(target = "tasks", ignore = true)
    @Mapping(target = "creationDate", ignore = true)
    @Mapping(target = "status", ignore = true)
    Sprint sprintRequestDTOToSprint(SprintRequestDTO sprintRequestDTO);

    @Mapping(target = "projectId", source = "project.id")
    SprintResponseDTO sprintToSprintResponseDTO(Sprint sprint);
}
