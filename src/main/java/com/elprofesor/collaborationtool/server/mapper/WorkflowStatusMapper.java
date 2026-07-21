package com.elprofesor.collaborationtool.server.mapper;

import com.elprofesor.collaborationtool.server.entities.WorkflowStatus;
import com.elprofesor.collaborationtool.server.models.WorkflowStatusRequestDTO;
import com.elprofesor.collaborationtool.server.models.WorkflowStatusResponseDTO;
import org.mapstruct.Mapper;

@Mapper
public interface WorkflowStatusMapper {
    WorkflowStatusRequestDTO workflowStatusToWorkflowStatusRequestDTO(WorkflowStatus status);
    WorkflowStatus workflowStatusRequestDtoToWorkflowStatus(WorkflowStatusRequestDTO dto);
    WorkflowStatus workflowStatusResponseDtoToWorkflowStatus(WorkflowStatusResponseDTO responseDto);
    WorkflowStatusResponseDTO workflowStatusToDto(WorkflowStatus workflowStatus);
}
