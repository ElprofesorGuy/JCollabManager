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
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@RequestBody @Valid UserRequestDTO dto, HttpServletResponse response) {
        AuthResponseDTO authResponse = authService.register(dto);
        setJwtCookie(response, authResponse.getToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion", description = "Entrez les identifiants d'un utilisateur pour se connecter")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "403", description = "Les identifiants sont erronés"),
            @ApiResponse(responseCode = "200", description = "Connexion réussie")
    })
    public ResponseEntity<AuthResponseDTO> login(@RequestBody @Valid LoginRequestDTO dto, HttpServletResponse response) {
        AuthResponseDTO authResponse = authService.login(dto);
        setJwtCookie(response, authResponse.getToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    @Operation(summary = "Déconnexion", description = "Se déconnecter de la plateforme")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(false) // Mettre à true en HTTPS
                .path("/")
                .maxAge(0) // Expire immédiatement
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok().build();
    }

    private void setJwtCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(false) // Mettre à true en HTTPS (prod)
                .path("/")
                .maxAge(24 * 60 * 60) // 1 jour
                .sameSite("Lax") // Protection CSRF basique
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
