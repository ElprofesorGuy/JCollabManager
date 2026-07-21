package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.entities.Users;

import java.util.UUID;

public interface ProjectSecurityService {

    public boolean hasProjectRole(UUID projectId, String requiredRole);
    public boolean canDeleteTask(UUID taskId);
    public boolean canCreateTask(UUID projecctId);
    public boolean canUpdateTask(UUID projectId);
    public boolean canUpdateProject(UUID projectId, UUID userId);
    public boolean canCreateUser(Users currentUser);
    public boolean canModifyStatusName (UUID projectId);
    public boolean isProjectMember(UUID projectId);
}
