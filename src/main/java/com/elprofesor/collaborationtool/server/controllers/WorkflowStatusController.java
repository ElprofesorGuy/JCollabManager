package com.elprofesor.collaborationtool.server.controllers;


import com.elprofesor.collaborationtool.server.models.WorkflowStatusRequestDTO;
import com.elprofesor.collaborationtool.server.models.WorkflowStatusResponseDTO;
import com.elprofesor.collaborationtool.server.services.WorkflowStatusService;
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
@PreAuthorize("isAuthenticated() || hasRole('ADMIN')")
public class WorkflowStatusController {
    private final WorkflowStatusService workflowStatusService;

    @PostMapping("/api/v1/projects/{projectId}/statuses")
    public ResponseEntity createNewWorkflowStatus(@RequestBody WorkflowStatusRequestDTO dto, @PathVariable("projectId") UUID projectId){
        WorkflowStatusResponseDTO newWorflowStatus = workflowStatusService.addWorkflowStatus(dto, projectId);
        HttpHeaders header = new HttpHeaders();
        header.add("Location", "/api/v1/projects/" + projectId + "/statuses/" + newWorflowStatus.getId());
        return new ResponseEntity(header, HttpStatus.CREATED);
    }


    @GetMapping("/api/v1/projects/{projectId}/statuses")
    public List<WorkflowStatusResponseDTO> getWorkflowStatusOfProject(@PathVariable("projectId") UUID projectId){
        return workflowStatusService.getWorkflowStatusOfProject(projectId);
    }

    @PreAuthorize("@projectSecurityServiceJPA.isProjectMember(#projectId)")
    @PutMapping("/api/v1/projects/{projectId}/statuses/{workflowStatusId}")
    public ResponseEntity updateWorkflowStatus(@PathVariable("projectId") UUID projectId, @RequestBody WorkflowStatusRequestDTO requestDTO, @PathVariable("workflowStatusId") UUID id){
        if(workflowStatusService.modifyWorkflowStatusOfProject(id, requestDTO).isEmpty()){
            throw new NotFoundException("WorkflowStatus not found");
        }

        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }

    @DeleteMapping("/api/v1/projects/{projectId}/statuses/{workflowStatusId}")
    public ResponseEntity deleteWorkflowStatus(@PathVariable("workflowStatusId") UUID workflowStatusId){
        if(!workflowStatusService.deleteStatus(workflowStatusId)){
            throw new NotFoundException("Status de tâche inexistant");
        }

        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }
}
