package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.models.*;
import com.elprofesor.collaborationtool.server.security.JwtUtil;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.mapper.UserMapper;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final EmailSenderService emailSenderService;

    // Register
    public AuthResponseDTO register(UserRequestDTO dto) {
        Users user = userMapper.userRequestDTOtoUser(dto);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername()); //Ligne modifiée
        return new AuthResponseDTO(token, userMapper.userToUserResponseDto(user));
    }

    // Login
    public AuthResponseDTO login(LoginRequestDTO dto) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPassword())  //Ligne modifié
        );

        Optional<Users> user = userRepository.findByUsername(dto.getUsername());  //Ligne modifiée
                //.orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        String token = jwtUtil.generateToken(user.get().getUsername());// Ligne modifiée
        return new AuthResponseDTO(token, userMapper.userToUserResponseDto(user.get()));
    }

    //Forgot Password
    public void forgotPassword(ForgotPasswordDTO dto){
        Optional<Users> user = userRepository.findByEmail(dto.getUserEmail());
        if(user.isPresent()){
            System.out.println("Utilisateur présent : " + user.get().getUsername());
            Long expirationToken = (long) (3*60*1000);//le token est valide pour 3 minutes
            String newToken = jwtUtil.generateToken(user.get().getUsername(), expirationToken);//Génération d'un nouveau token juste pour reset le MDP
            String resetLink = "http://localhost:5173/reset-password?token=" + newToken;
            String message = "Bonjour, vous avez demandé la réinitialisaiton de votre mot de passe.\n"
                    + "Veuillez cliquer sur le lien ci après pour choisir un nouveau mot de passe : "
                    + resetLink + ".\n" + "Attention, ce lien expire dans 3 minutes.\n"
                    + "Si vous n'êtes pas à l'origine de cet email, veuillez l'ignorer.";
            emailSenderService.sendMail(dto.getUserEmail(),
                    "Lien pour reset le password",
                    message);
        }

    }

    //Reset Password
    public void resetPassword(ResetPasswordDTO resetPasswordDTO){
        String username = jwtUtil.extractUsername(resetPasswordDTO.getToken());
        Optional<Users> user = userRepository.findByUsername(username);
        if(user.isPresent()){
            user.get().setPassword(passwordEncoder.encode(resetPasswordDTO.getNewPassword()));
            userRepository.save(user.get());
        }
    }
}
