package com.elprofesor.collaborationtool.server.controllers;


import com.elprofesor.collaborationtool.server.models.UserRequestDTO;
import com.elprofesor.collaborationtool.server.models.UserResponseDTO;
import com.elprofesor.collaborationtool.server.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final String USER_PATH = "/api/v1/user";
    private final String USER_PATH_ID = "/api/v1/user/{userId}";

    @GetMapping(USER_PATH)
    @PreAuthorize("isAuthenticated()")
    public List<UserResponseDTO> getListUsers(){
        return userService.getUsersList();
    }

    @GetMapping(USER_PATH_ID)
    @PreAuthorize("isAuthenticated()")
    public UserResponseDTO getSpecificUser(@PathVariable UUID userId){
        return userService.getUser(userId).orElseThrow(NotFoundException::new);
    }

    @PostMapping(USER_PATH)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity saveNewUser(@RequestBody UserRequestDTO userRequestDTO){
        UserRequestDTO newUser = userService.saveNewUser(userRequestDTO);
        HttpHeaders header = new HttpHeaders();
        header.add("Location", "/api/v1/user/" + newUser.getId());
        return new ResponseEntity(HttpStatus.CREATED);
    }

    @DeleteMapping(USER_PATH_ID)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity deleteUser(@PathVariable("userId") UUID userId){
        if(!userService.deleteUser(userId)){
            throw new NotFoundException();
        }
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }

    @PutMapping(USER_PATH_ID)
    public ResponseEntity updateExistingUser(@RequestBody UserResponseDTO userResponseDTO, @PathVariable("userId") UUID userId){
        if(userService.updateUser(userResponseDTO, userId).isEmpty()){
            throw new NotFoundException();
        }
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }
}
