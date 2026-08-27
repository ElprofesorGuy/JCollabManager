package com.elprofesor.collaborationtool.server.repositories;

import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.entities.ProjectMembership;
import com.elprofesor.collaborationtool.server.entities.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectMembershipRepository extends JpaRepository<ProjectMembership, UUID> {
    ProjectMembership findByProjectAndUser(Project project, Users user);
     ProjectMembership findByProjectIdAndUserId(UUID projectId, UUID userId);
     List<ProjectMembership> findByUser(Users currentUser);
     List<ProjectMembership> findByProjectId(UUID projectId);
}
