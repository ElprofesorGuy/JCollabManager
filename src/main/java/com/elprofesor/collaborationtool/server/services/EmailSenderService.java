package com.elprofesor.collaborationtool.server.services;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailSenderService {
    private final JavaMailSender javaMailSender;

    public void sendMailForResetPassword(String toEmail, String subject, String bodyEmail){
        SimpleMailMessage simpleMailMessage = new SimpleMailMessage();
        simpleMailMessage.setFrom("guembuguy69@gmail.com");
        simpleMailMessage.setTo(toEmail);
        simpleMailMessage.setText(bodyEmail);
        simpleMailMessage.setSubject(subject);
        javaMailSender.send(simpleMailMessage);
    }
}
