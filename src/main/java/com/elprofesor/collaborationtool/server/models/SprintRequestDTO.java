package com.elprofesor.collaborationtool.server.models;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintRequestDTO {
    @NotNull(message = "Sprint name is required")
    @Size(max = 100, message = "Sprint name must not exceed 100 characters")
    private String name;

    @Size(max = 255, message = "Goal must not exceed 255 characters")
    private String goal;

    private LocalDate startDate;
    private LocalDate endDate;
}
