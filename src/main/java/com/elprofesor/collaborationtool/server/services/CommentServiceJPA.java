package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Comment;
import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.mapper.CommentMapper;
import com.elprofesor.collaborationtool.server.models.*;
import com.elprofesor.collaborationtool.server.repositories.CommentRepository;
import com.elprofesor.collaborationtool.server.repositories.TaskRepository;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceJPA implements CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CommentMapper commentMapper;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public CommentResponseDTO addComment(CommentRequestDTO commentRequest, String authorEmail) {
        Task task = taskRepository.findById(commentRequest.getTaskId())
                .orElseThrow(NotFoundException::new);
        
        Users author = userRepository.findByUsername(authorEmail)
                .orElseThrow(NotFoundException::new);

        Comment comment = Comment.builder()
                .text(commentRequest.getText())
                .task(task)
                .author(author)
                .createdAt(LocalDateTime.now())
                .build();
        NotificationRequestDTO dto = NotificationRequestDTO.builder()
                .message("Un nouveau commentaire a été fait sur une de vos tâches")
                .recipientUsername(task.getAssign_to().getUsername())
                .type(NotificationType.COMMENTAIRE_AJOUTE)
                .build();
        notificationService.saveNewNotification(dto);
        Comment savedComment = commentRepository.save(comment);
        System.out.println("Un commentaire a été ajouté");
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

        Users currentUser = userRepository.findByUsername(authorEmail).orElseThrow(NotFoundException::new);
        
        // Only author or admin can delete a comment
        if (!comment.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new SecurityException("Not authorized to delete this comment");
        }

        commentRepository.delete(comment);
        return true;
    }

    @Override
    public Optional<CommentResponseDTO> updateComment(CommentRequestDTO newComment, UUID commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new  NotFoundException("Commentaire Inexistant"));
        Users currentUser = userRepository.findByUsername(userEmail).orElseThrow(NotFoundException::new);

        //Only author or admin can modify a comment
        if (!comment.getAuthor().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new SecurityException("Not authorized to modify this comment");
        }
        comment.setText(newComment.getText());
        return Optional.of(commentMapper.commentToCommentResponseDTO(commentRepository.save(comment)));
    }
}
