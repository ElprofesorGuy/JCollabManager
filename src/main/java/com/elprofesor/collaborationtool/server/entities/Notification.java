package com.elprofesor.collaborationtool.server.entities;

import com.elprofesor.collaborationtool.server.models.NotificationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.util.Objects;
import java.util.UUID;

@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(generator = "UUID")
    @UuidGenerator
    private UUID id;

    private String message;

    @ManyToOne
    @JoinColumn(name = "recipient_id", columnDefinition = "uuid")
    private Users destinataire;


    private boolean isRead;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type")
    private NotificationType type;

    private String targetUrl;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Users getDestinataire() {
        return destinataire;
    }

    public void setDestinataire(Users destinataire) {
        this.destinataire = destinataire;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setIsRead(boolean read) {
        isRead = read;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getTargetUrl() {
        return targetUrl;
    }

    public void setTargetUrl(String targetUrl) {
        this.targetUrl = targetUrl;
    }

    @Override
    public final boolean equals(Object o) {
        if (!(o instanceof Notification that)) return false;

        return isRead() == that.isRead() && Objects.equals(getId(), that.getId()) && Objects.equals(getMessage(), that.getMessage()) && Objects.equals(getDestinataire(), that.getDestinataire()) && getType() == that.getType() && Objects.equals(getTargetUrl(), that.getTargetUrl());
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(getId());
        result = 31 * result + Objects.hashCode(getMessage());
        result = 31 * result + Objects.hashCode(getDestinataire());
        result = 31 * result + Boolean.hashCode(isRead());
        result = 31 * result + Objects.hashCode(getType());
        result = 31 * result + Objects.hashCode(getTargetUrl());
        return result;
    }

    @Override
    public String toString() {
        return "Notification{" +
                "id=" + id +
                ", message='" + message + '\'' +
                ", destinataire=" + destinataire +
                ", isRead=" + isRead +
                ", type=" + type +
                ", targetUrl='" + targetUrl + '\'' +
                '}';
    }
}
