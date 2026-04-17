package com.elprofesor.collaborationtool.server.mapper;

import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.models.ProjectDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface ProjectMapper {

    @Mapping(source = "owner_id", target = "owner.id")
    Project projectDtoToProject(ProjectDTO projectDTO);

    @Mapping(source = "owner.id", target = "owner_id")
    ProjectDTO projectToProjectDto(Project project);
}
