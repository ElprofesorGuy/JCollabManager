package com.elprofesor.collaborationtool.server.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintResponseDTO {
    private UUID id;
    private String name;
    private String goal;
    private LocalDate startDate;
    private LocalDate endDate;
    private SprintStatus status;
    private UUID projectId;
    private LocalDate creationDate;
}
