ALTER TABLE task DROP CONSTRAINT IF EXISTS task_status_check;

ALTER TABLE task
    ADD CONSTRAINT task_status_check
        CHECK (status IN ('NOT_FINISH', 'END', 'TO_DO', 'OVERDUE'));