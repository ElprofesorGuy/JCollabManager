package com.elprofesor.collaborationtool.server.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Objects;

@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRequestDTO {
    private String username;
    private String email;
    private SystemRole role;
    private LocalDate date_creation;
    private String password;

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

    public SystemRole getRole() {
        return role;
    }

    public void setRole(SystemRole role) {
        this.role = role;
    }

    public LocalDate getDate_creation() {
        return date_creation;
    }

    public void setDate_creation(LocalDate date_creation) {
        this.date_creation = date_creation;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Override
    public final boolean equals(Object o) {
        if (!(o instanceof UserRequestDTO that)) return false;

        return  Objects.equals(getUsername(), that.getUsername()) && Objects.equals(getEmail(), that.getEmail()) && getRole() == that.getRole() && Objects.equals(getDate_creation(), that.getDate_creation()) && Objects.equals(getPassword(), that.getPassword());
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(getUsername());
        result = 31 * result + Objects.hashCode(getEmail());
        result = 31 * result + Objects.hashCode(getRole());
        result = 31 * result + Objects.hashCode(getDate_creation());
        result = 31 * result + Objects.hashCode(getPassword());
        return result;
    }

    @Override
    public String toString() {
        return "UserRequestDTO{" +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", role=" + role +
                ", date_creation=" + date_creation +
                ", password='" + password + '\'' +
                '}';
    }
}
