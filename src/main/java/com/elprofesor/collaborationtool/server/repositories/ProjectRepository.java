package com.elprofesor.collaborationtool.server.repositories;

import com.elprofesor.collaborationtool.server.entities.Project;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Project findByTitleContainingIgnoreCase(String title);
    //List<ProjectMembership> findByMemberships()
}
