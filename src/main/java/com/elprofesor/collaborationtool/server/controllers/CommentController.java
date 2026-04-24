package com.elprofesor.collaborationtool.server.controllers;

import com.elprofesor.collaborationtool.server.models.CommentRequestDTO;
import com.elprofesor.collaborationtool.server.models.CommentResponseDTO;
import com.elprofesor.collaborationtool.server.services.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister les commentaires", description = "Récupère la liste des commentaires pour une tâche spécifique")
    public ResponseEntity<List<CommentResponseDTO>> getComments(@PathVariable UUID taskId) {
        return ResponseEntity.ok(commentService.getCommentsForTask(taskId));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Ajouter un commentaire", description = "Ajoute un commentaire à une tâche")
    public ResponseEntity<CommentResponseDTO> addComment(@PathVariable UUID taskId, @RequestBody CommentRequestDTO commentRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        commentRequest.setTaskId(taskId);
        CommentResponseDTO newComment = commentService.addComment(commentRequest, auth.getName());
        return new ResponseEntity<>(newComment, HttpStatus.CREATED);
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Supprimer un commentaire", description = "Supprime un commentaire existant (auteur ou admin)")
    public ResponseEntity<Void> deleteComment(@PathVariable UUID taskId, @PathVariable UUID commentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        try {
            if (commentService.deleteComment(commentId, auth.getName())) {
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
