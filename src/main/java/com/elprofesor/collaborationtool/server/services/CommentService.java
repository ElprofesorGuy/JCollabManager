package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.models.CommentRequestDTO;
import com.elprofesor.collaborationtool.server.models.CommentResponseDTO;

import java.util.List;
import java.util.UUID;

public interface CommentService {
    CommentResponseDTO addComment(CommentRequestDTO commentRequest, String authorEmail);
    List<CommentResponseDTO> getCommentsForTask(UUID taskId);
    boolean deleteComment(UUID commentId, String authorEmail);
}
