package com.elprofesor.collaborationtool.server.mapper;

import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.models.ProjectRequestDTO;
import com.elprofesor.collaborationtool.server.models.ProjectResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(uses={TaskMapper.class}, componentModel = "spring")
public interface ProjectMapper {

    //@Mapping(source = "owner_id", target = "owner.id")
    //@Mapping(source = "managerEmail", target = "user")
    Project projectRequestDtoToProject(ProjectRequestDTO projectRequestDTO);

    //@Mapping(source = "owner.id", target = "owner_id")
    @Mapping(source = "user.email", target = "managerEmail")
    ProjectRequestDTO projectToProjectRequestDto(Project project);


    //@Mapping(source = "owner.username", target = "ownerName")
    @Mapping(source="user.email", target="managerEmail")
    ProjectResponseDTO projectToProjectResponseDto(Project project);

    //@Mapping(source="managerEmail", target="user.email")
    //Project projectResponseDtoToProject(ProjectResponseDTO projectResponseDTO);


}
