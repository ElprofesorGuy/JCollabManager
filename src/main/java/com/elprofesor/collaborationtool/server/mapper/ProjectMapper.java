package com.elprofesor.collaborationtool.server.mapper;

import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.models.ProjectRequestDTO;
import com.elprofesor.collaborationtool.server.models.ProjectResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface ProjectMapper {

    //@Mapping(source = "owner_id", target = "owner.id")
    Project projectRequestDtoToProject(ProjectRequestDTO projectRequestDTO);

    //@Mapping(source = "owner.id", target = "owner_id")
    ProjectRequestDTO projectToProjectRequestDto(Project project);

    @Mapping(source = "owner.email", target = "ownerEmail")
    @Mapping(source = "owner.username", target = "ownerName")
    ProjectResponseDTO projectToProjectResponseDto(Project project);

    @Mapping(source = "ownerEmail", target = "owner.email")
    Project projectResponseDtoToProject(ProjectResponseDTO projectResponseDTO);
}
