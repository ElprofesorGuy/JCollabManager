package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Comment;
import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.mapper.CommentMapper;
import com.elprofesor.collaborationtool.server.models.CommentRequestDTO;
import com.elprofesor.collaborationtool.server.models.CommentResponseDTO;
import com.elprofesor.collaborationtool.server.models.Role;
import com.elprofesor.collaborationtool.server.repositories.CommentRepository;
import com.elprofesor.collaborationtool.server.repositories.TaskRepository;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceJPA implements CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CommentMapper commentMapper;

    @Override
    @Transactional
    public CommentResponseDTO addComment(CommentRequestDTO commentRequest, String authorEmail) {
        Task task = taskRepository.findById(commentRequest.getTaskId())
                .orElseThrow(NotFoundException::new);
        
        Users author = userRepository.findByEmail(authorEmail)
                .orElseThrow(NotFoundException::new);

        Comment comment = Comment.builder()
                .text(commentRequest.getText())
                .task(task)
                .author(author)
                .createdAt(LocalDateTime.now())
                .build();

        Comment savedComment = commentRepository.save(comment);
        return commentMapper.commentToCommentResponseDTO(savedComment);
    }

    @Override
    public List<CommentResponseDTO> getCommentsForTask(UUID taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new NotFoundException();
        }
        
        return commentRepository.findByTaskIdOrderByCreatedAtDesc(taskId)
                .stream()
                .map(commentMapper::commentToCommentResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public boolean deleteComment(UUID commentId, String authorEmail) {
        Comment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null) {
            return false;
        }

        Users currentUser = userRepository.findByEmail(authorEmail).orElseThrow(NotFoundException::new);
        
        // Only author or admin can delete a comment
        if (!comment.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new SecurityException("Not authorized to delete this comment");
        }

        commentRepository.delete(comment);
        return true;
    }
}
