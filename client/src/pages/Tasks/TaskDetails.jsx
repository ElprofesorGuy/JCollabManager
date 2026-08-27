import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Calendar, User, AlignLeft, Clock, Flag, Zap,
  MessageSquare, Tag, X, Save, ChevronDown
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../api/axiosConfig';
import TaskComments from '../Projects/TaskComments';
import toast from 'react-hot-toast';

const taskSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères'),
  description: z.string().min(5, 'La description doit faire au moins 5 caractères'),
  assignTo: z.string().optional(),
  workflowStatus: z.string().optional(),
  taskType: z.enum(['EPIC', 'STORY', 'TASK', 'SUBTASK']).optional(),
  parentTaskName: z.string().optional(),
  dateDebut: z.string().optional(),
  dateEcheance: z.string().optional(),
  sprintId: z.string().optional().nullable(),
  storyPoints: z.coerce.number().min(0).optional().nullable(),
});

const TASK_TYPE_COLORS = {
  EPIC: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  STORY: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  TASK: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  SUBTASK: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

const DetailRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3 py-3 border-b border-[#1f293d]/60 last:border-0">
    <div className="mt-0.5 shrink-0">
      <Icon className="w-4 h-4 text-slate-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <div className="text-slate-200 text-sm">{children}</div>
    </div>
  </div>
);

/* ───────── Edit Form Modal ───────── */
const EditTaskModal = ({ task, statuses, sprints, members, allTasks, onClose, onSaved }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title || '',
      description: task.description || '',
      assignTo: task.assignTo || '',
      workflowStatus: task.workflowStatus || '',
      taskType: task.taskType || 'TASK',
      parentTaskName: task.parentTaskName || '',
      dateDebut: task.dateDebut ? String(task.dateDebut).slice(0, 10) : '',
      dateEcheance: task.dateEcheance ? String(task.dateEcheance).slice(0, 10) : '',
      sprintId: task.sprintId || '',
      storyPoints: task.storyPoints || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        assignTo: data.assignTo || '',
        workflowStatus: data.workflowStatus,
        taskType: data.taskType,
        parentTaskName: data.parentTaskName || '',
        dateDebut: data.dateDebut || null,
        dateEcheance: data.dateEcheance || null,
        sprintId: data.sprintId || null,
        storyPoints: data.storyPoints || null,
        projectName: task.projectName,
      };
      await api.put(`/v1/task/${task.id}/${task.projectId}`, payload);
      toast.success('Tâche mise à jour !');
      onSaved();
    } catch (err) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0e17]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-[#1f293d] rounded-2xl w-full max-w-2xl shadow-2xl shadow-black/50 my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1f293d]">
          <div>
            <h2 className="text-xl font-bold text-white">Modifier la tâche</h2>
            <p className="text-slate-400 text-sm mt-0.5">Mettez à jour les informations ci-dessous</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1f293d] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Titre *</label>
            <input
              type="text"
              {...register('title')}
              className={`w-full px-4 py-3 bg-[#121824] border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all ${errors.title ? 'border-rose-500' : 'border-[#1f293d] hover:border-slate-600'}`}
              placeholder="Titre de la tâche"
            />
            {errors.title && <p className="text-rose-400 text-xs mt-1.5">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description *</label>
            <textarea
              {...register('description')}
              rows={4}
              className={`w-full px-4 py-3 bg-[#121824] border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all resize-none ${errors.description ? 'border-rose-500' : 'border-[#1f293d] hover:border-slate-600'}`}
              placeholder="Décrivez le travail à effectuer..."
            />
            {errors.description && <p className="text-rose-400 text-xs mt-1.5">{errors.description.message}</p>}
          </div>

          {/* Type + Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Type</label>
              <div className="relative">
                <select
                  {...register('taskType')}
                  className="w-full appearance-none px-4 py-3 bg-[#121824] border border-[#1f293d] hover:border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all pr-10"
                >
                  <option value="EPIC">Epic</option>
                  <option value="STORY">Story</option>
                  <option value="TASK">Task</option>
                  <option value="SUBTASK">Subtask</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Statut</label>
              <div className="relative">
                <select
                  {...register('workflowStatus')}
                  className="w-full appearance-none px-4 py-3 bg-[#121824] border border-[#1f293d] hover:border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all pr-10"
                >
                  {statuses.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Assigné + Tâche parent */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assigné à</label>
              <div className="relative">
                <select
                  {...register('assignTo')}
                  className="w-full appearance-none px-4 py-3 bg-[#121824] border border-[#1f293d] hover:border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all pr-10"
                >
                  <option value="">-- Non assigné --</option>
                  {members.map(m => (
                    <option key={m.email} value={m.email}>{m.username || m.email}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tâche parente</label>
              <div className="relative">
                <select
                  {...register('parentTaskName')}
                  className="w-full appearance-none px-4 py-3 bg-[#121824] border border-[#1f293d] hover:border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all pr-10"
                >
                  <option value="">-- Aucune --</option>
                  {allTasks.filter(t => t.id !== task.id).map(t => (
                    <option key={t.id} value={t.title}>{t.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Date de début</label>
              <input type="date" {...register('dateDebut')} className="w-full px-4 py-3 bg-[#121824] border border-[#1f293d] hover:border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Date d'échéance</label>
              <input type="date" {...register('dateEcheance')} className="w-full px-4 py-3 bg-[#121824] border border-[#1f293d] hover:border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all" />
            </div>
          </div>

          {/* Sprint + Story Points */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sprint</label>
              <div className="relative">
                <select
                  {...register('sprintId')}
                  className="w-full appearance-none px-4 py-3 bg-[#121824] border border-[#1f293d] hover:border-slate-600 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all pr-10"
                >
                  <option value="">-- Backlog --</option>
                  {sprints.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Story Points</label>
              <input
                type="number"
                min="0"
                {...register('storyPoints')}
                className={`w-full px-4 py-3 bg-[#121824] border rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all ${errors.storyPoints ? 'border-rose-500' : 'border-[#1f293d] hover:border-slate-600'}`}
                placeholder="Ex: 5"
              />
              {errors.storyPoints && <p className="text-rose-400 text-xs mt-1.5">{errors.storyPoints.message}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-[#1f293d]">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-400 font-semibold hover:bg-[#1f293d] rounded-xl transition-colors text-sm">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors text-sm shadow-lg shadow-primary-500/20"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ───────── Main TaskDetails page ───────── */
const TaskDetails = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [members, setMembers] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { fetchAll(); }, [taskId]);

  const fetchAll = async () => {
    try {
      const [taskRes, statusRes, sprintRes, memberRes, tasksRes] = await Promise.all([
        api.get(`/v1/task/${taskId}`),
        api.get(`/v1/projects/${projectId}/statuses`).catch(() => ({ data: [] })),
        api.get(`/v1/projects/${projectId}/sprints`).catch(() => ({ data: [] })),
        api.get(`/v1/project/${projectId}/members`).catch(() => ({ data: [] })),
        api.get(`/v1/projects/${projectId}/tasks`).catch(() => ({ data: [] })),
      ]);
      setTask(taskRes.data);
      setStatuses(statusRes.data || []);
      setSprints(sprintRes.data || []);
      setMembers(memberRes.data || []);
      const tasksData = tasksRes.data;
      setAllTasks(Array.isArray(tasksData) ? tasksData : Object.values(tasksData || {}));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl text-slate-200">Tâche introuvable</h2>
        <button onClick={() => navigate(`/projects/${projectId}`, { state: location.state })} className="text-primary-400 mt-4 underline">Retour au projet</button>
      </div>
    );
  }

  const sprint = sprints.find(s => s.id === task.sprintId);
  const isOverdue = task.dateEcheance && new Date(task.dateEcheance) < new Date() && task.workflowStatus !== 'DONE';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate(`/projects/${projectId}`, { state: location.state })}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour au projet
        </button>
        <span className="text-slate-700">/</span>
        <span className="text-slate-400 text-sm truncate max-w-xs">{task.title}</span>
      </div>

      {/* Title + actions */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${TASK_TYPE_COLORS[task.taskType] || TASK_TYPE_COLORS.TASK}`}>
              {task.taskType}
            </span>
            {isOverdue && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider bg-rose-500/20 text-rose-300 border-rose-500/30">
                En retard
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">{task.title}</h1>
        </div>

        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-primary-500/20 shrink-0"
        >
          <Edit2 className="w-4 h-4" />
          Modifier
        </button>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Description */}
          <div className="bg-[#0f172a]/80 border border-[#1f293d] rounded-2xl p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4">
              <AlignLeft className="w-4 h-4 text-primary-400" />
              Description
            </h2>
            {task.description ? (
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{task.description}</p>
            ) : (
              <p className="text-slate-500 italic">Aucune description renseignée.</p>
            )}
          </div>

          {/* Comments */}
          <div className="bg-[#0f172a]/80 border border-[#1f293d] rounded-2xl p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4">
              <MessageSquare className="w-4 h-4 text-primary-400" />
              Commentaires
            </h2>
            <TaskComments taskId={taskId} projectId={projectId} onTaskUpdated={fetchAll} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-[#0f172a]/80 border border-[#1f293d] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-2">Détails</h2>

            <DetailRow icon={Flag} label="Statut">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#1f293d] text-slate-200 text-xs font-semibold">
                {task.workflowStatus || '—'}
              </span>
            </DetailRow>

            <DetailRow icon={User} label="Assigné à">
              {task.assignTo ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">
                    {task.assignTo[0]?.toUpperCase()}
                  </div>
                  <span>{task.assignTo}</span>
                </div>
              ) : (
                <span className="text-slate-500 italic">Non assigné</span>
              )}
            </DetailRow>

            <DetailRow icon={Tag} label="Sprint">
              {sprint ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  {sprint.name}
                </span>
              ) : (
                <span className="text-slate-500 italic">Backlog</span>
              )}
            </DetailRow>

            {task.storyPoints != null && (
              <DetailRow icon={Zap} label="Story Points">
                <span className="font-bold text-primary-400 text-base">{task.storyPoints}</span>
                <span className="text-slate-500 text-xs ml-1">pts</span>
              </DetailRow>
            )}

            <DetailRow icon={Calendar} label="Début">
              {task.dateDebut ? new Date(task.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : <span className="text-slate-500 italic">—</span>}
            </DetailRow>

            <DetailRow icon={Clock} label="Échéance">
              {task.dateEcheance ? (
                <span className={isOverdue ? 'text-rose-400 font-semibold' : ''}>
                  {new Date(task.dateEcheance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              ) : <span className="text-slate-500 italic">—</span>}
            </DetailRow>

            {task.parentTaskName && (
              <DetailRow icon={AlignLeft} label="Tâche parente">
                <span className="text-primary-400">{task.parentTaskName}</span>
              </DetailRow>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <EditTaskModal
          task={task}
          statuses={statuses}
          sprints={sprints}
          members={members}
          allTasks={allTasks}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); fetchAll(); }}
        />
      )}
    </div>
  );
};

export default TaskDetails;
