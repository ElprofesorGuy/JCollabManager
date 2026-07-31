package com.elprofesor.collaborationtool.server.services;

import com.elprofesor.collaborationtool.server.controllers.NotFoundException;
import com.elprofesor.collaborationtool.server.entities.*;
import com.elprofesor.collaborationtool.server.mapper.TaskMapper;
import com.elprofesor.collaborationtool.server.models.*;
import com.elprofesor.collaborationtool.server.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
public class TaskServiceJPA implements TaskService {

    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskDependencyRepository dependencyRepository;
    private final WorkflowStatusRepository workflowStatusRepository;
    private final FileStorageService fileStorageService;
    private final static int DEFAULT_PAGE = 0;
    private final static int DEFAULT_PAGE_SIZE = 20;

    @Override
    public TaskResponseDTO uploadAttachment(UUID taskId, MultipartFile file) {
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new NotFoundException("Tâche non trouvée"));
        String fileName = fileStorageService.storeFile(file);
        task.setAttachmentUrl(fileName);
        Task savedTask = taskRepository.save(task);
        
        return taskMapper.taskToTaskResponseDto(savedTask);
    }

    @Override
    public TaskResponseDTO removeAttachment(UUID taskId) {
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new NotFoundException("Tâche non trouvée"));
        if (task.getAttachmentUrl() != null) {
            fileStorageService.deleteFile(task.getAttachmentUrl());
            task.setAttachmentUrl(null);
            taskRepository.save(task);
        }
        
        return taskMapper.taskToTaskResponseDto(task);
    }

    @Override
    public boolean isPredecessorsAllCompleted(Task task) {
        boolean isAllCompleted = true;
        //Task task = taskRepository.findById(id).orElseThrow(() -> new NotFoundException("Tâche inexistante"));
        Set<TaskDependency> dependencies = dependencyRepository.findBySuccessor(task);
        for(TaskDependency item : dependencies){
            if(!item.getPredecessor().getStatus().getCompleted())
                isAllCompleted = false;
        }
        return isAllCompleted;
    }

    @Override
    public Optional<TaskResponseDTO> getTask(UUID id) {
        return Optional.ofNullable(taskMapper.taskToTaskResponseDto(taskRepository.findById(id).orElseThrow(NotFoundException::new)));
    }

    @Override
    public TaskResponseDTO saveNewTask(UUID projectId, TaskRequestDTO taskRequestDTO) {
        Project projet = projectRepository.findById(projectId).orElseThrow(()->
                new NotFoundException("Projet inexistant"));
        Optional<Users> assignee = Optional.empty();
        Task taskTosave = taskMapper.taskRequestDtoToTask(taskRequestDTO);
        taskTosave.setDateDebut(taskRequestDTO.getDateDebut());
        taskTosave.setProject(projet);
        if (taskRequestDTO.getAssignTo() != null && !taskRequestDTO.getAssignTo().trim().isEmpty()) {//Si la chaine assign_to n'est pas vide même après suppression des espaces
            assignee = userRepository.findByEmail(taskRequestDTO.getAssignTo());//On récupère l'utilisateur à qui la tâche sera assignée par son email
            taskTosave.setAssignTo(assignee.orElse(null));

        } else {
            taskTosave.setAssignTo(null);
        }
        WorkflowStatus defaultStatus = workflowStatusRepository.findByProjectIdAndOrderIndex(projectId, 0);
        taskTosave.setStatus(defaultStatus);
        projectRepository.save(projet);

        return taskMapper.taskToTaskResponseDto(taskRepository.save(taskTosave));

    }

    @Override
    public Optional<TaskRequestDTO> updateTask(UUID id, TaskRequestDTO taskRequestDTO) {
       Task tache = taskRepository.findById(id).orElseThrow(() -> new NotFoundException("Tâche non trouvée"));
        Project projet = tache.getProject();
       WorkflowStatus workflowStatus = workflowStatusRepository.findByNameIgnoringCaseAndProject(taskRequestDTO.getWorkflowStatus(), projet).orElseThrow(()
               -> new NotFoundException("Statut inexistant"));
        if(workflowStatus.getProject().getId().equals(projet.getId())){
            AtomicReference<Optional<TaskRequestDTO>> atomicReference = new AtomicReference<>();
            taskRepository.findById(id).ifPresentOrElse(foundTask -> {

                foundTask.setTitle(taskRequestDTO.getTitle());

                if(tache.getStatus().getCompleted()){
                    throw new IllegalArgumentException("Cette tâche est déjà marquée comme terminé, vous ne pouvez pas la modifier");

                }else if(!tache.getStatus().getCompleted() && workflowStatus.getCompleted()){
                    if(isPredecessorsAllCompleted(tache)){
                        foundTask.setSubmissionDate(LocalDate.now());
                        foundTask.setStatus(workflowStatus);
                    }else{
                        throw new IllegalArgumentException("Prédécesseurs non terminés");
                    }

                }
                foundTask.setStatus(workflowStatus);
                foundTask.setDescription(taskRequestDTO.getDescription());
                if(taskRequestDTO.getDateEcheance() != null){
                    if(taskRequestDTO.getDateEcheance().isBefore(LocalDate.now()) && !taskRequestDTO.getDateEcheance().equals(tache.getDateEcheance())){
                        throw new IllegalArgumentException("Champ dateEcheance invalide : choisissez une date ultérieure à la date actuelle");
                    }else{
                        foundTask.setDateEcheance(taskRequestDTO.getDateEcheance());
                    }
                }
                if(taskRequestDTO.getDateDebut() != null && taskRequestDTO.getDateDebut().isBefore(taskRequestDTO.getDateEcheance())){
                    foundTask.setDateDebut(taskRequestDTO.getDateDebut());
                }
                if (taskRequestDTO.getAssignTo() != null && !taskRequestDTO.getAssignTo().trim().isEmpty()) {
                    Optional<Users> assignee = userRepository.findByEmail(taskRequestDTO.getAssignTo());
                    if(assignee.isEmpty()) assignee = userRepository.findByUsername(taskRequestDTO.getAssignTo());
                    foundTask.setAssignTo(assignee.orElse(null));
                    if (assignee.isPresent()) {
                        projectRepository.save(projet);
                    }
                } else {
                    foundTask.setAssignTo(null);
                }
                Task savedTask = taskRepository.save(foundTask);
                atomicReference.set(Optional.of(taskMapper.taskToTaskRequestDto(savedTask)));
            }, () -> {
                atomicReference.set(Optional.empty());
            });
            return atomicReference.get();
        }else{
            throw new IllegalArgumentException("Mauvaise opération");
        }

    }

    @Override
    public void deleteTask(UUID id) {
        taskRepository.deleteById(id);
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
    public Page<TaskResponseDTO> listOfTasks(String taskTitle, String status, Integer pageNumber, Integer pageSize) {
        Page<Task> listTasks;
        PageRequest pageRequest = buildPageRequest(pageNumber, pageSize);

        WorkflowStatus workflowStatus = (status != null)
                ? workflowStatusRepository.findByNameIgnoringCase(status).orElse(null)
                : null;

        if (StringUtils.hasText(taskTitle) && workflowStatus != null) {
            listTasks = taskRepository.findByTitleIsLikeIgnoreCaseAndStatus("%" + taskTitle + "%", workflowStatus, pageRequest);
        } else if (StringUtils.hasText(taskTitle)) {
            listTasks = taskRepository.findByTitleIsLikeIgnoreCase("%" + taskTitle + "%", pageRequest);
        } else if (workflowStatus != null) {
            listTasks = taskRepository.findAllByStatus(workflowStatus, pageRequest);
        } else {
            listTasks = taskRepository.findAll(pageRequest);
        }

        return listTasks.map(taskMapper::taskToTaskResponseDto);
    }

    @Override
    public List<TaskResponseDTO> listofUnachievedTask(){
        List<WorkflowStatus> unachiedevStatuses = workflowStatusRepository.findAllByOrderIndexNotAndCompletedFalse(0);
        return taskRepository.findByStatusIn(unachiedevStatuses).stream()
                .map(taskMapper::taskToTaskResponseDto)
                .toList();

    }

    @Override
    public List<TaskResponseDTO> listofUnstartedTask(){
        List<WorkflowStatus> unstartedStatuses = workflowStatusRepository.findAllByOrderIndex(0);
        return taskRepository.findByStatusIn(unstartedStatuses).stream()
                .map(taskMapper::taskToTaskResponseDto)
                .toList();
    }


}