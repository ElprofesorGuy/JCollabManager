package com.elprofesor.collaborationtool.server.controllers;

import com.elprofesor.collaborationtool.server.models.SprintRequestDTO;
import com.elprofesor.collaborationtool.server.models.SprintResponseDTO;
import com.elprofesor.collaborationtool.server.services.SprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @PostMapping("/projects/{projectId}/sprints")
    public ResponseEntity<SprintResponseDTO> createSprint(
            @PathVariable UUID projectId,
            @Valid @RequestBody SprintRequestDTO sprintRequestDTO) {
        SprintResponseDTO createdSprint = sprintService.createSprint(projectId, sprintRequestDTO);
        return new ResponseEntity<>(createdSprint, HttpStatus.CREATED);
    }

    @GetMapping("/projects/{projectId}/sprints")
    public ResponseEntity<List<SprintResponseDTO>> getSprintsByProject(@PathVariable UUID projectId) {
        List<SprintResponseDTO> sprints = sprintService.getSprintsByProject(projectId);
        return ResponseEntity.ok(sprints);
    }

    @PutMapping("/sprints/{sprintId}")
    public ResponseEntity<SprintResponseDTO> updateSprint(
            @PathVariable UUID sprintId,
            @Valid @RequestBody SprintRequestDTO sprintRequestDTO) {
        SprintResponseDTO updatedSprint = sprintService.updateSprint(sprintId, sprintRequestDTO);
        return ResponseEntity.ok(updatedSprint);
    }

    @DeleteMapping("/sprints/{sprintId}")
    public ResponseEntity<Void> deleteSprint(@PathVariable UUID sprintId) {
        sprintService.deleteSprint(sprintId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/sprints/{sprintId}/start")
    public ResponseEntity<SprintResponseDTO> startSprint(@PathVariable UUID sprintId) {
        SprintResponseDTO sprint = sprintService.startSprint(sprintId);
        return ResponseEntity.ok(sprint);
    }

    @PutMapping("/sprints/{sprintId}/complete")
    public ResponseEntity<SprintResponseDTO> completeSprint(@PathVariable UUID sprintId) {
        SprintResponseDTO sprint = sprintService.completeSprint(sprintId);
        return ResponseEntity.ok(sprint);
    }
}
