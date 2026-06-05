package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.Project;
import com.elprofesor.collaborationtool.server.entities.Task;
import com.elprofesor.collaborationtool.server.entities.Users;
import com.elprofesor.collaborationtool.server.mapper.TaskMapper;
import com.elprofesor.collaborationtool.server.mapper.UserMapper;
import com.elprofesor.collaborationtool.server.models.*;
import com.elprofesor.collaborationtool.server.repositories.ProjectRepository;
import com.elprofesor.collaborationtool.server.repositories.TaskRepository;
import com.elprofesor.collaborationtool.server.repositories.UserRepository;
import jdk.jshell.Snippet;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class TaskServiceJPA implements TaskService {

    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final FileStorageService fileStorageService;
    private final static int DEFAULT_PAGE = 0;
    private final static int DEFAULT_PAGE_SIZE = 20;
    private final NotificationService notificationService;

    @Override
    public TaskResponseDTO uploadAttachment(UUID taskId, MultipartFile file, Users currentUser) {
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new NotFoundException("Tâche non trouvée"));
        Project project = task.getProject();
        
        // Vérification des permissions : owner ou membre assigné (ou admin)
        // Simplifions en autorisant l'owner ou l'utilisateur assigné
        boolean isOwner = project.getOwner().equals(currentUser);
        boolean isAssignee = task.getAssign_to() != null && task.getAssign_to().equals(currentUser);
        
        if (!isOwner && !isAssignee) {
            throw new AccessDeniedException("Seul le chef de projet ou la personne assignée peut ajouter une pièce jointe.");
        }

        String fileName = fileStorageService.storeFile(file);
        task.setAttachmentUrl(fileName);
        Task savedTask = taskRepository.save(task);
        
        return taskMapper.taskToTaskResponseDto(savedTask);
    }

    @Override
    public TaskResponseDTO removeAttachment(UUID taskId, Users currentUser) {
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new NotFoundException("Tâche non trouvée"));
        Project project = task.getProject();
        
        boolean isOwner = project.getOwner().equals(currentUser);
        boolean isAssignee = task.getAssign_to() != null && task.getAssign_to().equals(currentUser);
        
        if (!isOwner && !isAssignee) {
            throw new AccessDeniedException("Seul le chef de projet ou la personne assignée peut supprimer une pièce jointe.");
        }

        if (task.getAttachmentUrl() != null) {
            fileStorageService.deleteFile(task.getAttachmentUrl());
            task.setAttachmentUrl(null);
            taskRepository.save(task);
        }
        
        return taskMapper.taskToTaskResponseDto(task);
    }

    @Override
    public Optional<TaskResponseDTO> getTask(UUID id) {
        return Optional.ofNullable(taskMapper.taskToTaskResponseDto(taskRepository.findById(id).orElseThrow(NotFoundException::new)));
    }

    @Override
    public TaskResponseDTO saveNewTask(UUID projectId, TaskRequestDTO taskRequestDTO, Users currentUser) {
        Optional<Project> projet = projectRepository.findById(projectId);
        Optional<Users> assignee = Optional.empty();
        System.out.println("Assigné à : " + taskRequestDTO.getAssign_to());
        Task taskTosave = taskMapper.taskRequestDtoToTask(taskRequestDTO);
        //System.out.println("Id de la tâche : " + taskTosave.getId());
        //System.out.println("Statut de la tâche : " + taskTosave.getStatus());
        taskTosave.setProject(projectRepository.findByTitleContainingIgnoreCase(taskRequestDTO.getProjectName()));
        if (taskRequestDTO.getAssign_to() != null && !taskRequestDTO.getAssign_to().trim().isEmpty()) {//Si la chaine assign_to n'est pas vide même après suppression des espaces
            assignee = userRepository.findByEmail(taskRequestDTO.getAssign_to());//On récupère l'utilisateur à qui la tâche sera assignée par son email
            if(assignee.isEmpty()) assignee = userRepository.findByUsername(taskRequestDTO.getAssign_to());//On fait une recherche de l'utilisateur par son nom
            taskTosave.setAssign_to(assignee.orElse(null));

        } else {
            taskTosave.setAssign_to(null);
        }
        if(projet.get().getOwner().equals(currentUser)){//On vérifie si l'utilisateur connecté est le chef de projet du projet dont on souhaite définir une tâche
            if (assignee.isPresent()) {
                projet.get().addMember(assignee.get());//Et ce n'est qu'à ce moment , on peut valider la requête et ajouter assignee comme membre de l'équipe
                NotificationRequestDTO dto = NotificationRequestDTO.builder()
                        .type(NotificationType.NOUVELLE_TACHE)
                        .message("Vous avez une nouvelle tâche qui vous est assignée : " + taskRequestDTO.getTitle())
                        .recipientUsername(assignee.get().getUsername())
                        .build();
                notificationService.saveNewNotification(dto);
                projectRepository.save(projet.get());
            }
            return taskMapper.taskToTaskResponseDto(taskRepository.save(taskTosave));
        }else{
            throw new AccessDeniedException("Seul l'owner du projet peut ajouter une nouvelle tâche au projet");
        }

    }

    @Override
    public Optional<TaskRequestDTO> updateTask(UUID id, TaskRequestDTO taskRequestDTO, Users currentUser) {
       Task tache = taskRepository.findById(id).orElseThrow(() -> new NotFoundException("Tâche non trouvée"));
        Project projet = tache.getProject();
        if(projet.getOwner().equals(currentUser)){
            AtomicReference<Optional<TaskRequestDTO>> atomicReference = new AtomicReference<>();
            taskRepository.findById(id).ifPresentOrElse(foundTask -> {
                foundTask.setTitle(taskRequestDTO.getTitle());
                if(taskRequestDTO.getStatus().equals(Status.OVERDUE)){//On ne peut marquer manuellement une tâche comme OVERDUE
                    throw new IllegalArgumentException("Impossible de marquer manuellement une tâche comme OVERDUE.");
                }
                if(tache.getStatus().equals(Status.END)){
                    System.out.println("Impossible de modifier cette tâche");
                    throw new IllegalArgumentException("Cette tâche est déjà marquée comme terminé, vous ne pouvez pas modifier son statut");

                }else if(tache.getStatus().equals(Status.TO_DO) && taskRequestDTO.getStatus().equals(Status.END)){
                    throw new IllegalArgumentException("Impossible de faire passer cette de \"A faire\" à \"Terminé\" sans passer par \"En cours\"");
                }else if(tache.getStatus().equals(Status.OVERDUE)){//Une tâche rétardée dans sa livraison ne peut voir son statut être modifiée
                    throw new IllegalArgumentException("Impossible de modifier le statut de cete tâche.");
                } else{
                    foundTask.setStatus(taskRequestDTO.getStatus());
                }
                foundTask.setDescription(taskRequestDTO.getDescription());
                if(taskRequestDTO.getDateEcheance() != null){
                    if(taskRequestDTO.getDateEcheance().isBefore(LocalDate.now())){
                        throw new IllegalArgumentException("Champ dateEcheance invalide : choisissez une date ultérieure à la date actuelle");
                    }else{
                        foundTask.setDateEcheance(taskRequestDTO.getDateEcheance());
                        System.out.println("Date echéance : " + foundTask.getDateEcheance());
                    }
                }
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
        Project projet = projectRepository.findByTitleContainingIgnoreCase(tache.get().getProject().getTitle());
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

    @Override
    public List<TaskResponseDTO> listOverdueTask() {
        return taskRepository.findByDateEcheanceBeforeAndStatusNot(LocalDate.now(), Status.END)
                .stream()
                .map(taskMapper::taskToTaskResponseDto)
                .collect(Collectors.toList());

    }


    public PageRequest buildPageRequest(Integer pageNumber, Integer pageSize){
        int queryPageNumber;
        int queryPageSize;
        if(pageNumber != null && pageNumber>0){
            queryPageNumber = pageNumber - 1;
        }else{
            queryPageNumber = DEFAULT_PAGE;
        }
        if(pageSize == null){
            queryPageSize = DEFAULT_PAGE_SIZE;
        }else{
            if(pageSize > 1000){
                queryPageSize = 1000;
            }else{
                queryPageSize = pageSize;
            }

        }
        return PageRequest.of(queryPageNumber, queryPageSize);
    }

    public Page<Task> listTaskByName(String taskTitle, Pageable pageable){
        return taskRepository.findByTitleIsLikeIgnoreCase("%" + taskTitle + "%", pageable);
    }

    @Override
    public Page<TaskResponseDTO> listOfTasks(String taskTitle, Status status,Integer pageNumber, Integer pageSize) {
        Page<Task> listTasks;
        PageRequest pageRequest = buildPageRequest(pageNumber, pageSize);
        if(StringUtils.hasText(taskTitle) && status != null){
            listTasks = taskRepository.findByTitleIsLikeIgnoreCaseAndStatus("%" + taskTitle + "%", status, pageRequest);
        }else if(StringUtils.hasText(taskTitle)){
            listTasks = taskRepository.findByTitleIsLikeIgnoreCase("%" + taskTitle + "%", pageRequest);
        }else if(status != null){
            listTasks = taskRepository.findByStatus(status, pageRequest);
        }else{
            listTasks = taskRepository.findAll(pageRequest);
        }

        return listTasks.map(taskMapper::taskToTaskResponseDto);
    }


}
