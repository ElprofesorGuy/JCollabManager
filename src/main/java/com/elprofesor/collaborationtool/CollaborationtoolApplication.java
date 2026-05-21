package com.elprofesor.collaborationtool;

import com.elprofesor.collaborationtool.server.services.EmailSenderService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@RequiredArgsConstructor
public class CollaborationtoolApplication {
    //private final EmailSenderService emailSenderService;


	public static void main(String[] args) {
		SpringApplication.run(CollaborationtoolApplication.class, args);
	}

    /*@EventListener(ApplicationReadyEvent.class)
    public void sendMail(){
        emailSenderService.sendEmail("guyeinstein15@gmail.com", "This is subject",
                "Send an email through my Spring boot Application");
    }*/


}
