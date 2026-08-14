package com.elprofesor.collaborationtool.server.mapper;

import com.elprofesor.collaborationtool.server.entities.ProjectMembership;
import com.elprofesor.collaborationtool.server.models.ProjectMemberResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProjectMemberMapper {

    @Mapping(source = "user.id", target = "id")
    @Mapping(source = "user.username", target = "username")
    @Mapping(source = "user.email", target = "email")
    @Mapping(source = "role", target = "projectRole")
    ProjectMemberResponseDTO toProjectMemberResponseDto(ProjectMembership membership);
}
