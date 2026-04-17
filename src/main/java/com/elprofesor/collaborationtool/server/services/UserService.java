package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.models.UserRequestDTO;
import com.elprofesor.collaborationtool.server.models.UserResponseDTO;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface UserService {
    Optional<UserResponseDTO> getUser(UUID id);
    Boolean deleteUser(UUID userId);
    UserRequestDTO saveNewUser(UserRequestDTO newUser);
    Optional<UserResponseDTO> updateUser(UserResponseDTO existingUser, UUID userId);
    List<UserResponseDTO> getUsersList();
}
