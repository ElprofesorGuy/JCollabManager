package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;

import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;


@Builder
public class UserResponseDTO {

    private UUID id;
    private String username;
    private String email;
    private Role role;
    private LocalDate date_creation;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDate getDate_creation() {
        return date_creation;
    }

    public void setDate_creation(LocalDate date_creation) {
        this.date_creation = date_creation;
    }

    @Override
    public final boolean equals(Object o) {
        if (!(o instanceof UserResponseDTO users)) return false;

        return Objects.equals(getId(), users.getId()) && Objects.equals(getUsername(), users.getUsername()) && Objects.equals(getEmail(), users.getEmail()) && Objects.equals(getRole(), users.getRole()) && Objects.equals(getDate_creation(), users.getDate_creation());
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(getId());
        result = 31 * result + Objects.hashCode(getUsername());
        result = 31 * result + Objects.hashCode(getEmail());
        result = 31 * result + Objects.hashCode(getRole());
        result = 31 * result + Objects.hashCode(getDate_creation());
        return result;
    }

    @Override
    public String toString() {
        return "Users{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", role='" + role + '\'' +
                ", date_creation=" + date_creation +
                '}';
    }
}
