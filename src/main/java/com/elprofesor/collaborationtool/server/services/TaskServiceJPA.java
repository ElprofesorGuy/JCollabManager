package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.mapper.TaskMapper;
import com.elprofesor.collaborationtool.server.mapper.UserMapper;
import com.elprofesor.collaborationtool.server.models.TaskRequestDTO;
import com.elprofesor.collaborationtool.server.models.TaskResponseDTO;
import com.elprofesor.collaborationtool.server.repositories.ProjectRepository;
import com.elprofesor.collaborationtool.server.repositories.TaskRepository;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceJPA implements TaskService {

    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    @Override
    public List<TaskResponseDTO> listTask() {
        return taskRepository.findAll()
                .stream()
                .map(taskMapper::taskToTaskResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<TaskResponseDTO> getTask(UUID id) {
        return Optional.ofNullable(taskMapper.taskToTaskResponseDto(taskRepository.findById(id).orElseThrow(NotFoundException::new)));
    }

    @Override
    public TaskResponseDTO saveNewTask(UUID projectId, TaskRequestDTO taskRequestDTO, Users currentUser) {
        Optional<Project> projet = projectRepository.findById(projectId);
        Task taskTosave = taskMapper.taskRequestDtoToTask(taskRequestDTO);
        taskTosave.setProject(projectRepository.findByTitleContainingIgnoreCase(taskRequestDTO.getProjectName()));
        if (taskRequestDTO.getAssign_to() != null && !taskRequestDTO.getAssign_to().trim().isEmpty()) {
            Optional<Users> assignee = userRepository.findByEmail(taskRequestDTO.getAssign_to());
            if(assignee.isEmpty()) assignee = userRepository.findByUsername(taskRequestDTO.getAssign_to());
            taskTosave.setAssign_to(assignee.orElse(null));
            if (assignee.isPresent()) {
                projet.get().addMember(assignee.get());
                projectRepository.save(projet.get());
            }
        } else {
            taskTosave.setAssign_to(null);
        }
        if(projet.get().getOwner().equals(currentUser)){
            return taskMapper.taskToTaskResponseDto(taskRepository.save(taskTosave));
        }else{
            throw new AccessDeniedException("Seul l'owner du projet peut ajouter une nouvelle tâche au projet");
        }

    }

    @Override
    public Optional<TaskRequestDTO> updateTask(UUID id, TaskRequestDTO taskRequestDTO, Users currentUser) {
        Optional<Task> tache = taskRepository.findById(id);
        Project projet = tache.get().getProject();
        if(projet.getOwner().equals(currentUser)){
            AtomicReference<Optional<TaskRequestDTO>> atomicReference = new AtomicReference<>();
            taskRepository.findById(id).ifPresentOrElse(foundTask -> {
                foundTask.setTitle(taskRequestDTO.getTitle());
                foundTask.setStatus(taskRequestDTO.getStatus());
                foundTask.setDescription(taskRequestDTO.getDescription());
                if (taskRequestDTO.getAssign_to() != null && !taskRequestDTO.getAssign_to().trim().isEmpty()) {
                    Optional<Users> assignee = userRepository.findByEmail(taskRequestDTO.getAssign_to());
                    if(assignee.isEmpty()) assignee = userRepository.findByUsername(taskRequestDTO.getAssign_to());
                    foundTask.setAssign_to(assignee.orElse(null));
                    if (assignee.isPresent()) {
                        projet.addMember(assignee.get());
                        projectRepository.save(projet);
                    }
                } else {
                    foundTask.setAssign_to(null);
                }
                Task savedTask = taskRepository.save(foundTask);
                atomicReference.set(Optional.of(taskMapper.taskToTaskRequestDto(savedTask)));
            }, () -> {
                atomicReference.set(Optional.empty());
            });
            return atomicReference.get();
        }else{
            throw new AccessDeniedException("Seul un owner peut modifier les informations d'une tâche.");
        }

    }

    @Override
    public Boolean deleteTask(UUID id, Users currentUser) {
        Optional<Task> tache = taskRepository.findById(id);
        System.out.println("Nom de la tâche trouvée : " + tache.get().getTitle());
        Project projet = projectRepository.findByTitleContainingIgnoreCase(tache.get().getProject().getTitle());
        //System.out.println("Projet correspondant : " + projet.toString());
        System.out.println("Owner trouvé : " + projet.getOwner().getUsername());
        System.out.println("Utilisateur actuellement connecté : " + currentUser.getUsername());
        if(projet.getOwner().equals(currentUser)){
            if(taskRepository.existsById(id)){
                taskRepository.deleteById(id);
                return true;
            }
        }else{
            throw new AccessDeniedException("Seul le owner du projet peut supprimer cette tâche");
        }

        return false;
    }
}
