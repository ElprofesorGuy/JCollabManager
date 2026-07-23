package com.elprofesor.collaborationtool.server.bootstrap;


import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.models.SystemRole;
import com.elprofesor.collaborationtool.server.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class BootstrapData implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        loadUserData();
    }


    private void loadUserData(){
        if(userRepository.count() == 0){
            Users user1 = Users.builder()
                    .date_creation(LocalDate.now())
                    .email("guyeinstein@gmail.com")
                    .role(SystemRole.ADMIN)
                    .username("Le natif")
                    .password(passwordEncoder.encode("aileDe Pigeon"))
                    .build();
            userRepository.save(user1);
        }

    }
}
