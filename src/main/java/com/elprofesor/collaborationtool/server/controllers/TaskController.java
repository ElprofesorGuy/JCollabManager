package com.elprofesor.collaborationtool.server.controllers;

import com.elprofesor.collaborationtool.server.models.TaskDTO;
import com.elprofesor.collaborationtool.server.services.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TaskController {
    private final TaskService taskService;
    private final String TASK_PATH = "/api/v1/task";
    private final String TASK_PATH_ID = TASK_PATH + "/{taskId}";

    @GetMapping(TASK_PATH)
    public List<TaskDTO> displayListOfTasks(){
        return taskService.listTask();
    }

    @GetMapping(TASK_PATH_ID)
    public TaskDTO getTask(@PathVariable("taskId") UUID taskId){
        return taskService.getTask(taskId).orElseThrow(NotFoundException::new);
    }

    @DeleteMapping(TASK_PATH_ID)
    public ResponseEntity deleteTask(@PathVariable("taskId") UUID taskId){
        if(! taskService.deleteTask(taskId)){
            throw new NotFoundException();
        }
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }

    @PostMapping(TASK_PATH)
    public ResponseEntity saveNewTask(@RequestBody TaskDTO taskDTO){
        TaskDTO newTask = taskService.saveNewTask(taskDTO);
        HttpHeaders header = new HttpHeaders();
        header.add("Location", "/api/v1/task/" + newTask.getId());
        return new ResponseEntity(HttpStatus.CREATED);
    }

    @PutMapping(TASK_PATH_ID)
    public ResponseEntity updateExistingTask(@PathVariable UUID taskId, @RequestBody TaskDTO taskDTO){
        if(taskService.updateTask(taskId, taskDTO).isEmpty()){
            throw new NotFoundException();
        }
        return new ResponseEntity(HttpStatus.NO_CONTENT);
    }
}
