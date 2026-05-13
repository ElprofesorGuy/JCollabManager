package com.elprofesor.collaborationtool;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CollaborationtoolApplication {

	public static void main(String[] args) {
		SpringApplication.run(CollaborationtoolApplication.class, args);
	}

}
