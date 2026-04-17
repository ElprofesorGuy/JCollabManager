package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.mapper.UserMapper;
import com.elprofesor.collaborationtool.server.models.UserRequestDTO;
import com.elprofesor.collaborationtool.server.models.UserResponseDTO;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceJPA implements UserService{

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    public Optional<UserResponseDTO> getUser(UUID id) {
        return Optional.of(userMapper.userToUserResponseDto(userRepository.findById(id).orElseThrow(NotFoundException::new)));
    }

    @Override
    public Boolean deleteUser(UUID userId) {
        if(userRepository.existsById(userId)){
            userRepository.deleteById(userId);
            return true;
        }
        return false;
    }

    @Override
    public UserRequestDTO saveNewUser(UserRequestDTO newUser) {
        return userMapper.userToUserRequestDto(userRepository.save(userMapper.userRequestDTOtoUser(newUser)));
    }

    @Override
    public Optional<UserResponseDTO> updateUser(UserResponseDTO existingUser, UUID userId) {
        userRepository.findById(userId).map(foundUser -> {
            foundUser.setEmail(existingUser.getEmail());
            foundUser.setRole(existingUser.getRole());
            foundUser.setUsername(existingUser.getUsername());
            Users saveUser = userRepository.save(foundUser);
            return saveUser;
        });
        return Optional.empty();
    }

    @Override
    public List<UserResponseDTO> getUsersList() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::userToUserResponseDto)
                .collect(Collectors.toList());
    }
}
