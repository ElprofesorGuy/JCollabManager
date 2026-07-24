package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.models.ProfileUpdateRequestDTO;
import com.elprofesor.collaborationtool.server.models.UserRequestDTO;
import com.elprofesor.collaborationtool.server.models.UserResponseDTO;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface UserService {
    Optional<UserResponseDTO> getUser(UUID id);
    Boolean deleteUser(UUID userId);
    UserResponseDTO saveNewUser(UserRequestDTO newUser);
    Optional<UserResponseDTO> updateUser(UserRequestDTO existingUser, UUID userId);
    List<UserResponseDTO> getUsersList();
    Optional<UserResponseDTO> updateProfile(ProfileUpdateRequestDTO profileRequest, UUID userId, UserDetails userDetails);
}
