package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;


import java.util.Objects;



@Builder
public class ProjectRequestDTO {
    private String title;
    private String description;
    private String managerEmail;


    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getManagerEmail() {
        return managerEmail;
    }

    public void setManagerEmail(String managerEmail) {
        this.managerEmail = managerEmail;
    }

    @Override
    public final boolean equals(Object o) {
        if (!(o instanceof ProjectRequestDTO that)) return false;

        return Objects.equals(getTitle(), that.getTitle()) && Objects.equals(getDescription(), that.getDescription()) && Objects.equals(getManagerEmail(), that.getManagerEmail());
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(getTitle());
        result = 31 * result + Objects.hashCode(getDescription());
        return result;
    }

    @Override
    public String toString() {
        return "ProjectRequestDTO{" +
                "title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", managerEmail='" + managerEmail + '\'' +
                '}';
    }
}
