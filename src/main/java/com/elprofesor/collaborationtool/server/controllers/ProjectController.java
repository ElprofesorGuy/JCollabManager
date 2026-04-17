package com.elprofesor.collaborationtool.server.controllers;

import com.elprofesor.collaborationtool.server.models.ProjectDTO;
import com.elprofesor.collaborationtool.server.services.ProjectService;
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
public class ProjectController {

    private final ProjectService projectService;
    private final String PROJECT_PATH = "/api/v1/project";
    private final String PROJECT_PATH_ID = PROJECT_PATH + "/{projectId}";

    @GetMapping(PROJECT_PATH)
    @PreAuthorize("hasRole('ADMIN')")
    public List<ProjectDTO> displayListProject(){
        return projectService.listProjects();
    }

    @GetMapping(PROJECT_PATH_ID)
    public ProjectDTO getProjectById(@PathVariable("projectId")UUID projectId){
        return projectService.getProjectById(projectId).orElseThrow(NotFoundException::new);
    }

    @PostMapping(PROJECT_PATH)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity saveNewProject(@RequestBody ProjectDTO projectDTO){
        ProjectDTO newProject = projectService.saveNewProject(projectDTO);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Location", PROJECT_PATH + "/" + projectDTO.getId());
        return new ResponseEntity(HttpStatus.CREATED);
    }

    @PutMapping(PROJECT_PATH_ID)
    public ResponseEntity updateProject(@PathVariable("projectId") UUID projectId, @RequestBody ProjectDTO projectUpToDate){
        projectService.updateProjectById(projectId, projectUpToDate);
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }

    @DeleteMapping(PROJECT_PATH_ID)
    @PreAuthorize("@projectService.isProjectOwner(#projectId, authentication.name)")
    public ResponseEntity deleteProjectById(@PathVariable("projectId") UUID projectId){
        projectService.deleteProject(projectId);
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }
}
