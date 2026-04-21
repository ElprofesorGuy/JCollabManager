package com.elprofesor.collaborationtool.server.controllers;

import com.elprofesor.collaborationtool.server.models.AuthResponseDTO;
import com.elprofesor.collaborationtool.server.models.LoginRequestDTO;
import com.elprofesor.collaborationtool.server.models.UserRequestDTO;
import com.elprofesor.collaborationtool.server.services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@RequestBody @Valid UserRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(dto));
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion", description = "Entrez les identifiants d'un utilisateur pour se connecter")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "403", description = "Les identifiants sont erronés"),
            @ApiResponse(responseCode = "200", description = "Connexion réussie")
    })
    public ResponseEntity<AuthResponseDTO> login(@RequestBody @Valid LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.login(dto));
    }
}
