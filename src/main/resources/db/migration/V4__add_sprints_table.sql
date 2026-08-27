CREATE TABLE sprint (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    goal VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL,
    project_id UUID NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sprint_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

ALTER TABLE task ADD COLUMN sprint_id UUID;
ALTER TABLE task ADD CONSTRAINT fk_task_sprint FOREIGN KEY (sprint_id) REFERENCES sprint(id) ON DELETE SET NULL;
ALTER TABLE task ADD COLUMN story_points INT;
