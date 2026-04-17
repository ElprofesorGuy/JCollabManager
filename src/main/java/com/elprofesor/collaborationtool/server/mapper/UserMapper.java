package com.elprofesor.collaborationtool.server.mapper;

import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.models.UserRequestDTO;
import com.elprofesor.collaborationtool.server.models.UserResponseDTO;
import org.mapstruct.Mapper;

@Mapper
public interface UserMapper {
    Users userResponseDtoToUser(UserResponseDTO userResponseDTO);
    UserResponseDTO userToUserResponseDto(Users user);
    Users userRequestDTOtoUser(UserRequestDTO userRequestDTO);
    UserRequestDTO userToUserRequestDto(Users user);
}
