package com.elprofesor.collaborationtool.server.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // Activation explicite du broker WebSocket (Oubli corrigé)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws") // Point de terminaison pour la connexion
                .setAllowedOriginPatterns("http://localhost:5173", "http://localhost:3000") // Autoriser le frontend (CORS)
                .withSockJS(); // Support de SockJS en cas de problème de connexion WebSocket pure
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Canaux de diffusion généraux (/topic) et privés (/queue)
        registry.enableSimpleBroker("/topic", "/queue"); 
        registry.setApplicationDestinationPrefixes("/app");
        
        // Indispensable pour envoyer des messages à un utilisateur spécifique (convertAndSendToUser)
        registry.setUserDestinationPrefix("/user"); 
    }

}
