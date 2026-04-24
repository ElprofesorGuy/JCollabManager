package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.mapper.UserMapper;
import com.elprofesor.collaborationtool.server.models.ProfileUpdateRequestDTO;
import com.elprofesor.collaborationtool.server.models.UserRequestDTO;
import com.elprofesor.collaborationtool.server.models.UserResponseDTO;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.elprofesor.collaborationtool.server.models.Role;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceJPA implements UserService{

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

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
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        newUser.setRole(Role.MEMBER);
        return userMapper.userToUserRequestDto(userRepository.save(userMapper.userRequestDTOtoUser(newUser)));
    }

    @Override
    public Optional<UserResponseDTO> updateUser(UserRequestDTO existingUser, UUID userId) {
        UserRequestDTO dto = UserRequestDTO.builder().build();
        AtomicReference<Optional<UserResponseDTO>> atomicReference = new AtomicReference<>();
        userRepository.findById(userId).ifPresentOrElse(foundUser -> {
            System.out.println("Id trouvé : " + foundUser.getId());
            foundUser.setEmail(existingUser.getEmail());
            foundUser.setRole(existingUser.getRole());
            foundUser.setUsername(existingUser.getUsername());
            userRepository.save(foundUser);
            atomicReference.set(Optional.of(userMapper.userToUserResponseDto(userRepository.save(foundUser))));
        }, ()->{
            atomicReference.set(Optional.empty());
        });
        return atomicReference.get();
    }

    @Override
    public List<UserResponseDTO> getUsersList() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::userToUserResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<UserResponseDTO> updateProfile(ProfileUpdateRequestDTO profileRequest, UUID userId, String currentUserEmail) {
        AtomicReference<Optional<UserResponseDTO>> atomicReference = new AtomicReference<>();
        userRepository.findById(userId).ifPresentOrElse(foundUser -> {
            // Security check: Only allow users to update their own profile (or admin, but we check email here for simplicity)
            if (!foundUser.getEmail().equals(currentUserEmail)) {
                throw new SecurityException("You can only update your own profile");
            }
            
            if (profileRequest.getUsername() != null && !profileRequest.getUsername().isEmpty()) {
                foundUser.setUsername(profileRequest.getUsername());
            }

            if (profileRequest.getNewPassword() != null && !profileRequest.getNewPassword().isEmpty()) {
                if (profileRequest.getCurrentPassword() != null && passwordEncoder.matches(profileRequest.getCurrentPassword(), foundUser.getPassword())) {
                    foundUser.setPassword(passwordEncoder.encode(profileRequest.getNewPassword()));
                } else {
                    throw new IllegalArgumentException("Le mot de passe actuel est incorrect");
                }
            }
            
            userRepository.save(foundUser);
            atomicReference.set(Optional.of(userMapper.userToUserResponseDto(foundUser)));
        }, ()->{
            atomicReference.set(Optional.empty());
        });
        return atomicReference.get();
    }
}
