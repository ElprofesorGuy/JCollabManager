package com.elprofesor.collaborationtool.server.models;

public enum TaskType {
    EPIC("Epic"),
    STORY("Story"),
    TASK("Task"),
    SUBTASK("Subtask");

    private final String taskType;

    TaskType (String taskType){
        this.taskType = taskType;
    }

    public String getTaskType() {
        return taskType;
    }
}
