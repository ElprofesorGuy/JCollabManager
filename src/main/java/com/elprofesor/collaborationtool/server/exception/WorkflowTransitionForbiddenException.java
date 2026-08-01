package com.elprofesor.collaborationtool.server.exception;

public class WorkflowTransitionForbiddenException extends RuntimeException {
    public WorkflowTransitionForbiddenException(String message) {
        super(message);
    }
}
