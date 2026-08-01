package com.elprofesor.collaborationtool.server.controllers;

import com.elprofesor.collaborationtool.server.models.WorkflowTransitionRequestDTO;
import com.elprofesor.collaborationtool.server.models.WorkflowTransitionResponseDTO;
import com.elprofesor.collaborationtool.server.services.WorkflowTransitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class WorkflowTransitionController {

    private final WorkflowTransitionService workflowTransitionService;

    @PostMapping("/api/v1/projects/{projectId}/transitions")
    @PreAuthorize("@projectSecurityServiceJPA.hasProjectRole(#projectId, 'MANAGER')")
    public ResponseEntity createTransition(@PathVariable("projectId") UUID projectId,
                                           @RequestBody WorkflowTransitionRequestDTO dto) {
        WorkflowTransitionResponseDTO transition = workflowTransitionService.addTransition(projectId, dto);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Location", "/api/v1/projects/" + projectId + "/transitions/" + transition.getId());
        return new ResponseEntity(headers, HttpStatus.CREATED);
    }

    @GetMapping("/api/v1/projects/{projectId}/transitions")
    @PreAuthorize("@projectSecurityServiceJPA.isProjectMember(#projectId)")
    public List<WorkflowTransitionResponseDTO> listTransitions(@PathVariable("projectId") UUID projectId) {
        return workflowTransitionService.listTransitions(projectId);
    }

    @GetMapping("/api/v1/projects/{projectId}/statuses/{statusId}/transitions")
    @PreAuthorize("@projectSecurityServiceJPA.isProjectMember(#projectId)")
    public List<WorkflowTransitionResponseDTO> listAllowedTransitions(@PathVariable("projectId") UUID projectId,
                                                                      @PathVariable("statusId") UUID statusId) {
        return workflowTransitionService.listAllowedTransitions(projectId, statusId);
    }

    @PutMapping("/api/v1/projects/{projectId}/transitions/{transitionId}")
    @PreAuthorize("@projectSecurityServiceJPA.hasProjectRole(#projectId, 'MANAGER')")
    public WorkflowTransitionResponseDTO updateTransition(@PathVariable("projectId") UUID projectId,
                                                          @PathVariable("transitionId") UUID transitionId,
                                                          @RequestBody WorkflowTransitionRequestDTO dto) {
        return workflowTransitionService.updateTransition(projectId, transitionId, dto);
    }

    @DeleteMapping("/api/v1/projects/{projectId}/transitions/{transitionId}")
    @PreAuthorize("@projectSecurityServiceJPA.hasProjectRole(#projectId, 'MANAGER')")
    public ResponseEntity deleteTransition(@PathVariable("projectId") UUID projectId,
                                           @PathVariable("transitionId") UUID transitionId) {
        workflowTransitionService.deleteTransition(projectId, transitionId);
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }
}
