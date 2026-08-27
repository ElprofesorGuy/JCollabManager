import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Play, CheckCircle, Clock, Calendar, MoreVertical, Trash2, AlertTriangle, X, AlertCircle } from 'lucide-react';
import api from '../../api/axiosConfig';

const TaskItem = ({ task, index, onTaskClick }) => {
  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onTaskClick(task)}
          className="bg-[#121824]/50 p-3 rounded-lg border border-[#1f293d] hover:border-slate-600 transition-all cursor-pointer shadow-sm mb-2 group"
        >
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-slate-200 text-sm group-hover:text-white transition-colors">{task.title}</h4>
            {task.storyPoints && (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold shrink-0 ml-2">
                {task.storyPoints}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>{task.workflowStatus || 'A faire'}</span>
            {task.assignTo && <span>• {task.assignTo.split('@')[0]}</span>}
          </div>
        </div>
      )}
    </Draggable>
  );
};

const SprintBoard = ({ sprint, tasks, onStart, onComplete, onTaskClick, onDelete }) => {
  const isActionable = sprint.status !== 'COMPLETED';

  return (
    <div className="bg-[#0f172a]/60 border border-[#1f293d] rounded-2xl p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            {sprint.name}
            {sprint.status === 'ACTIVE' && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">ACTIF</span>}
            {sprint.status === 'COMPLETED' && <span className="text-[10px] bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full font-bold border border-slate-500/30">TERMINÉ</span>}
          </h3>
          {sprint.goal && <p className="text-slate-400 text-xs mt-1">{sprint.goal}</p>}
        </div>
        <div className="flex items-center gap-2">
          {sprint.status === 'PLANNED' && (
            <button onClick={() => onStart(sprint.id)} className="bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
              <Play className="w-3.5 h-3.5" /> Démarrer le sprint
            </button>
          )}
          {sprint.status === 'ACTIVE' && (
            <button onClick={() => onComplete(sprint.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
              <CheckCircle className="w-3.5 h-3.5" /> Terminer le sprint
            </button>
          )}
          {isActionable && (
            <button onClick={() => onDelete(sprint.id)} className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <Droppable droppableId={`sprint-${sprint.id}`} isDropDisabled={!isActionable}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[100px] p-2 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-primary-500/10 border border-primary-500/30 border-dashed' : 'bg-transparent'}`}
          >
            {tasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-6 text-slate-500 text-sm border-2 border-dashed border-[#1f293d] rounded-xl">
                Planifiez vos tâches ici
              </div>
            ) : (
              tasks.map((t, i) => <TaskItem key={t.id} task={t} index={i} onTaskClick={onTaskClick} />)
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

const BacklogView = ({ projectId, tasks, sprints, statuses, refreshData, onTaskClick }) => {
  const backlogTasks = tasks.filter(t => !t.sprintId);
  
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: '', goal: '', startDate: '', endDate: '' });

  // Modale d'alerte pour les tâches incomplètes lors de la fin de sprint
  const [incompleteModal, setIncompleteModal] = useState(null); // { sprintId, incompleteTasks[] }
  const [sprintActionError, setSprintActionError] = useState('');

  const handleCreateSprintSubmit = async (e) => {
    e.preventDefault();
    if (!newSprint.name) return;
    try {
      await api.post(`/v1/projects/${projectId}/sprints`, { 
        name: newSprint.name, 
        goal: newSprint.goal, 
        startDate: newSprint.startDate || null, 
        endDate: newSprint.endDate || null 
      });
      setIsSprintModalOpen(false);
      setNewSprint({ name: '', goal: '', startDate: '', endDate: '' });
      refreshData();
    } catch (err) {
      setSprintActionError("Erreur lors de la création du sprint");
    }
  };
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return; // Ignore reordering for now, or implement it if order is maintained.

    const taskId = draggableId;
    const destSprintId = destination.droppableId.replace('sprint-', '');
    const finalSprintId = destSprintId === 'backlog' ? null : destSprintId;

    try {
      // Find the task
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Optimistic update
      const payload = {
        title: task.title,
        description: task.description,
        assignTo: task.assignTo,
        dateEcheance: task.dateEcheance,
        dateDebut: task.dateDebut,
        taskType: task.taskType,
        workflowStatus: task.workflowStatus,
        storyPoints: task.storyPoints,
        sprintId: finalSprintId
      };
      
      // Update backend
      await api.put(`/v1/task/${taskId}/${projectId}`, payload);
      refreshData();
    } catch (err) {
      console.error('Erreur lors du déplacement de la tâche', err);
      refreshData(); // Revert
    }
  };



  const handleStartSprint = async (sprintId) => {
    try {
      await api.put(`/v1/sprints/${sprintId}/start`);
      refreshData();
    } catch (err) {
      setSprintActionError(err.response?.data?.message || "Erreur lors du démarrage du sprint");
    }
  };

  const handleCompleteSprint = async (sprintId) => {
    const sprintTasks = tasks.filter(t => t.sprintId === sprintId);
    const incompleteTasks = sprintTasks.filter(t => {
      const st = statuses.find(s => s.name === t.workflowStatus);
      return !st || !st.completed;
    });

    if (incompleteTasks.length > 0) {
      setIncompleteModal({ sprintId, incompleteTasks });
      return;
    }

    await doCompleteSprint(sprintId);
  };

  const doCompleteSprint = async (sprintId) => {
    try {
      await api.put(`/v1/sprints/${sprintId}/complete`);
      setIncompleteModal(null);
      refreshData();
    } catch (err) {
      setSprintActionError(err.response?.data?.message || "Erreur lors de la complétion du sprint");
      setIncompleteModal(null);
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce sprint ? Les tâches retourneront dans le backlog.")) return;
    try {
      await api.delete(`/v1/sprints/${sprintId}`);
      refreshData();
    } catch (err) {
      setSprintActionError("Erreur lors de la suppression du sprint");
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Bannière d'erreur d'action sprint */}
      {sprintActionError && (
        <div className="mb-4 flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-sm text-rose-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="flex-1">{sprintActionError}</span>
          <button onClick={() => setSprintActionError('')} className="text-rose-400 hover:text-rose-200 shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Colonne de gauche: Sprints */}
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Sprints</h2>
            <button onClick={() => setIsSprintModalOpen(true)} className="bg-[#1f293d] hover:bg-primary-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Créer un sprint
            </button>
          </div>
          
          <div className="space-y-4">
            {sprints.map(sprint => (
              <SprintBoard
                key={sprint.id}
                sprint={sprint}
                tasks={tasks.filter(t => t.sprintId === sprint.id)}
                onStart={handleStartSprint}
                onComplete={handleCompleteSprint}
                onTaskClick={onTaskClick}
                onDelete={handleDeleteSprint}
              />
            ))}
            {sprints.length === 0 && (
              <div className="text-center py-12 bg-[#121824]/30 border border-dashed border-[#1f293d] rounded-2xl">
                <p className="text-slate-400">Aucun sprint n'a été créé.</p>
              </div>
            )}
          </div>
        </div>

        {/* Colonne de droite: Backlog */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-[#121824]/60 border border-[#1f293d] rounded-2xl p-4 sticky top-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1f293d]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-400" />
                Backlog
              </h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full font-bold">
                {backlogTasks.length}
              </span>
            </div>
            
            <Droppable droppableId="sprint-backlog">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[300px] max-h-[600px] overflow-y-auto custom-scrollbar pr-2 p-2 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-primary-500/10 border border-primary-500/30 border-dashed' : 'bg-transparent'}`}
                >
                  {backlogTasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      Le backlog est vide.
                    </div>
                  ) : (
                    backlogTasks.map((t, i) => <TaskItem key={t.id} task={t} index={i} onTaskClick={onTaskClick} />)
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </div>
      
      {/* Create Sprint Modal */}
      {isSprintModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-[#1f293d] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Créer un sprint</h2>
            <form onSubmit={handleCreateSprintSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nom du sprint *</label>
                <input required type="text" value={newSprint.name} onChange={e => setNewSprint({...newSprint, name: e.target.value})} className="w-full px-3.5 py-2 bg-[#0f172a] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-white" placeholder="ex: Sprint 1" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Objectif (Goal)</label>
                <textarea value={newSprint.goal} onChange={e => setNewSprint({...newSprint, goal: e.target.value})} className="w-full px-3.5 py-2 bg-[#0f172a] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-white min-h-[80px]" placeholder="But du sprint..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Début</label>
                  <input type="date" value={newSprint.startDate} onChange={e => setNewSprint({...newSprint, startDate: e.target.value})} className="w-full px-3.5 py-2 bg-[#0f172a] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fin</label>
                  <input type="date" value={newSprint.endDate} onChange={e => setNewSprint({...newSprint, endDate: e.target.value})} className="w-full px-3.5 py-2 bg-[#0f172a] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#1f293d]">
                <button type="button" onClick={() => setIsSprintModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors">Annuler</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-xl font-semibold transition-colors shadow-lg shadow-primary-500/20">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale — Tâches incomplètes dans le sprint */}
      {incompleteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIncompleteModal(null)}>
          <div className="bg-[#0f172a] border border-amber-500/30 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-amber-500/20 flex items-center justify-between bg-gradient-to-r from-amber-950/40 to-[#0f172a]">
              <h2 className="text-base font-bold text-amber-400 flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-500/15 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                Sprint non terminé
              </h2>
              <button onClick={() => setIncompleteModal(null)} className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-slate-300 text-sm leading-relaxed">
                Il reste <strong className="text-amber-400">{incompleteModal.incompleteTasks.length} tâche(s) non terminée(s)</strong> dans ce sprint. Vous pouvez les déplacer vers le backlog, ou forcer la clôture du sprint.
              </p>

              {/* Liste des tâches incomplètes */}
              <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {incompleteModal.incompleteTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2.5 bg-[#121824]/60 border border-[#1f293d] rounded-xl">
                    <span className="text-sm font-semibold text-slate-200 truncate">{t.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 shrink-0 ml-2">{t.workflowStatus || 'Aucun statut'}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Forcer la clôture déplacera automatiquement les tâches non terminées vers le backlog.</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIncompleteModal(null)}
                  className="flex-1 px-4 py-2.5 text-slate-300 font-semibold bg-[#121824] hover:bg-slate-800/70 border border-[#1f293d] hover:border-slate-600 rounded-xl transition-all text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => doCompleteSprint(incompleteModal.sprintId)}
                  className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-900/30"
                >
                  <CheckCircle className="w-4 h-4" /> Forcer la clôture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DragDropContext>
  );
};

export default BacklogView;

