package com.elprofesor.collaborationtool.server.models;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CommentResponseDTO {
    private UUID id;
    private String text;
    private LocalDateTime createdAt;
    private String authorName;
    private UUID authorId;
    private UUID taskId;
}
