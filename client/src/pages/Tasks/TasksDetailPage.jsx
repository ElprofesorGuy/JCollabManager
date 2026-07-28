import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Clock, CheckCircle, ListTodo,
  Calendar, Users, Edit2, X, AlertCircle, Layers, Search, Filter
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axiosConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

/* ─────────────── helpers ─────────────── */

const parseDate = (d) => {
  if (!d) return null;
  if (Array.isArray(d)) { const [y, m, day] = d; return new Date(y, m - 1, day); }
  const p = String(d).split('-');
  if (p.length === 3) return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
  return new Date(d);
};

const formatDate = (d) => {
  if (!d) return '—';
  try {
    const s = String(d).split('T')[0];
    const p = s.split('-');
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return s;
  } catch { return '—'; }
};

const isOverdue = (dateEcheance, isCompleted) => {
  if (!dateEcheance || isCompleted) return false;
  const due = parseDate(dateEcheance);
  if (!due) return false;
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return today > due;
};

const taskSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères'),
  description: z.string().min(5, 'La description doit faire au moins 5 caractères'),
  assign_to: z.string().optional(),
  workflowStatus: z.string().optional(),
  taskType: z.enum(['EPIC', 'STORY', 'TASK', 'SUBTASK']).optional(),
  parentTaskName: z.string().optional(),
  dateDebut: z.string().optional(),
  dateEcheance: z.string().optional(),
});

/* ─────────── category config ─────────── */

const CATEGORY_CONFIG = {
  overdue: {
    label: 'Tâches en retard',
    description: 'Tâches dont la date d\'échéance est dépassée et qui ne sont pas encore soumises.',
    icon: AlertTriangle,
    color: 'rose',
    borderColor: 'border-l-rose-500',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    emptyMsg: 'Aucune tâche en retard. Bravo !',
  },
  'not-started': {
    label: 'Tâches non commencées',
    description: 'Tâches dans la première colonne du kanban — pas encore traitées.',
    icon: ListTodo,
    color: 'slate',
    borderColor: 'border-l-slate-500',
    iconBg: 'bg-slate-500/10',
    iconColor: 'text-slate-400',
    badgeBg: 'bg-slate-700 text-slate-300 border-slate-600',
    emptyMsg: 'Toutes les tâches ont été démarrées.',
  },
  'in-progress': {
    label: 'Tâches en cours',
    description: 'Tâches en cours de traitement — ni à la première colonne, ni dans le statut final.',
    icon: Clock,
    color: 'cyan',
    borderColor: 'border-l-cyan-500',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    emptyMsg: 'Aucune tâche en cours de traitement.',
  },
  completed: {
    label: 'Tâches terminées',
    description: 'Tâches dans le statut final — travail soumis.',
    icon: CheckCircle,
    color: 'emerald',
    borderColor: 'border-l-emerald-500',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    emptyMsg: 'Aucune tâche terminée pour l\'instant.',
  },
};

/* ─────────── EditTaskModal ─────────── */

const EditTaskModal = ({ task, onClose, onSaved, statuses }) => {
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title || '',
      description: task.description || '',
      assign_to: task.assign_to || '',
      workflowStatus: task.workflowStatus || '',
      taskType: task.taskType || 'TASK',
      parentTaskName: task.parentTaskName || '',
      dateDebut: task.dateDebut ? String(task.dateDebut).slice(0, 10) : '',
      dateEcheance: task.dateEcheance ? String(task.dateEcheance).slice(0, 10) : '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      const payload = {
        title: data.title,
        description: data.description,
        assign_to: data.assign_to || '',
        workflowStatus: data.workflowStatus || task.workflowStatus,
        taskType: data.taskType || 'TASK',
        parentTaskName: data.parentTaskName || '',
        dateDebut: data.dateDebut || null,
        dateEcheance: data.dateEcheance || null,
        projectName: task.projectName,
      };
      await api.put(`/v1/task/${task.id}/${task.projectId}`, payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Erreur lors de la modification.');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0f172a] border border-[#1f293d] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1f293d] flex justify-between items-center bg-[#121824]/50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-primary-400" />
              Modifier la tâche
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{task.projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Statut */}
            {statuses.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Statut</label>
                <select {...register('workflowStatus')} className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm">
                  {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            )}

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Type de tâche</label>
              <select {...register('taskType')} className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm">
                <option value="TASK">Task</option>
                <option value="EPIC">Epic</option>
                <option value="STORY">Story</option>
                <option value="SUBTASK">Subtask</option>
              </select>
            </div>

            {/* Titre */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Titre</label>
              <input
                {...register('title')}
                className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.title ? 'border-rose-500' : 'border-[#1f293d]'}`}
              />
              {errors.title && <p className="text-rose-400 text-xs mt-1">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.description ? 'border-rose-500' : 'border-[#1f293d]'}`}
              />
              {errors.description && <p className="text-rose-400 text-xs mt-1">{errors.description.message}</p>}
            </div>

            {/* Assigner */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assigner à <span className="text-slate-500 font-normal">— Optionnel</span></label>
              <input
                {...register('assign_to')}
                placeholder="email@exemple.com"
                className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date de début</label>
                <input type="date" {...register('dateDebut')} className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date d'échéance</label>
                <input type="date" {...register('dateEcheance')} className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-[#1f293d]/50">
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 font-semibold hover:bg-slate-800/50 rounded-xl transition-colors text-sm">
                Annuler
              </button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-sm">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Mettre à jour
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ─────────── TaskRow ─────────── */

const TaskRow = ({ task, config, canEdit, onEditClick }) => {
  const overdue = isOverdue(task.dateEcheance, task.isCompleted);

  return (
    <div className={`bg-[#121824]/40 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-slate-600 transition-all border-l-4 ${config.borderColor} ${overdue ? 'border-rose-500/30' : 'border-[#1f293d]'}`}>
      {/* Infos principales */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1 flex-wrap">
          <h3 className="font-bold text-slate-200 text-sm leading-snug">{task.title}</h3>
          {overdue && (
            <span className="flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider shrink-0">
              <AlertTriangle className="w-2.5 h-2.5" /> En retard
            </span>
          )}
          {task.isCompleted && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase shrink-0">✓ Terminé</span>
          )}
        </div>
        <p className="text-xs text-slate-400 line-clamp-1 mb-2">{task.description}</p>

        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          {/* Projet */}
          <Link
            to={`/projects/${task.projectId}`}
            className="flex items-center gap-1 font-bold text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-md hover:bg-primary-500/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Layers className="w-3 h-3" />
            {task.projectName}
          </Link>

          {/* Statut */}
          <span className={`font-bold px-2 py-0.5 rounded-md border ${config.badgeBg}`}>
            {task.workflowStatus || '—'}
          </span>

          {/* Assigné */}
          {task.assign_to && (
            <span className="flex items-center gap-1 text-slate-400 bg-slate-800/60 border border-slate-700 px-2 py-0.5 rounded-md font-semibold">
              <Users className="w-3 h-3" />
              {task.assign_to.split('@')[0]}
            </span>
          )}
        </div>
      </div>

      {/* Dates + actions */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className="text-right">
          {task.submissionDate ? (
            <div className="text-[10px] text-emerald-400 font-semibold">
              <p className="text-slate-500">Soumis le</p>
              <p>{formatDate(task.submissionDate)}</p>
            </div>
          ) : task.dateEcheance ? (
            <div className={`text-[10px] font-semibold ${overdue ? 'text-rose-400' : 'text-slate-400'}`}>
              <p className="text-slate-500">Échéance</p>
              <p className="flex items-center gap-1 justify-end">
                <Calendar className="w-3 h-3" />
                {formatDate(task.dateEcheance)}
              </p>
            </div>
          ) : (
            <p className="text-[10px] text-slate-600 italic">Pas d'échéance</p>
          )}
        </div>

        {canEdit && (
          <button
            onClick={() => onEditClick(task)}
            className="p-2.5 bg-[#1f293d] hover:bg-primary-600 text-slate-400 hover:text-white rounded-xl transition-all border border-[#1f293d] hover:border-primary-500"
            title="Modifier cette tâche"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/* ─────────── Main Page ─────────── */

const TasksDetailPage = () => {
  const { category } = useParams();
  const { user } = useAuthStore();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [statusesByProject, setStatusesByProject] = useState({});
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState({});

  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['overdue'];
  const CategoryIcon = config.icon;
  const isAdmin = user?.role === 'ADMIN';

  /* ── fetch tasks ── */
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let fetched = [];

      if (category === 'in-progress' && isAdmin) {
        const res = await api.get('/v1/task/unachievedtask');
        fetched = res.data || [];
      } else if (category === 'not-started' && isAdmin) {
        const res = await api.get('/v1/task/unstartedtask');
        fetched = res.data || [];
      } else {
        // Fallback: load all tasks and filter client-side
        const res = await api.get('/v1/task?pageSize=1000');
        const all = res.data?.content || res.data || [];

        if (category === 'completed') {
          fetched = all.filter(t => t.isCompleted);
        } else if (category === 'overdue') {
          fetched = all.filter(t => isOverdue(t.dateEcheance, t.isCompleted) && !t.submissionDate);
        } else if (category === 'in-progress') {
          // non-admin fallback: tasks that are not completed and not literally overdue
          // We cannot know orderIndex without the field, but we can exclude isCompleted=true
          fetched = all.filter(t => !t.isCompleted);
        } else if (category === 'not-started') {
          // non-admin: best effort — show tasks without progress
          fetched = all.filter(t => !t.isCompleted);
        }
      }

      // Enrich tasks with projectId by fetching projects
      // The taskResponseDTO doesn't include projectId directly, we infer from project list
      const projectsRes = await api.get(isAdmin ? '/v1/project' : '/v1/project/my-projects');
      const projects = projectsRes.data || [];
      const projectIdByName = {};
      projects.forEach(p => { projectIdByName[p.title] = p.id; });

      fetched = fetched.map(t => ({
        ...t,
        projectId: projectIdByName[t.projectName] || null,
      }));

      setTasks(fetched);

      // Fetch statuses & members for edit modal (per project)
      const uniqueProjectIds = [...new Set(fetched.map(t => t.projectId).filter(Boolean))];
      const statusMap = {};
      const memberMap = {};

      await Promise.all(uniqueProjectIds.map(async (pid) => {
        try {
          const [sRes, mRes] = await Promise.all([
            api.get(`/v1/projects/${pid}/statuses`),
            api.get(`/v1/project/${pid}/members`),
          ]);
          statusMap[pid] = sRes.data || [];
          memberMap[pid] = mRes.data || [];
        } catch { /* ignore */ }
      }));

      setStatusesByProject(statusMap);
      setMembers(memberMap);
    } catch (err) {
      setError('Impossible de charger les tâches.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, isAdmin]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  /* ── permission check ── */
  const canEditTask = (task) => {
    if (isAdmin) return true;
    const projectMembers = members[task.projectId] || [];
    const me = projectMembers.find(m => m.email === user?.email || m.username === user?.username);
    if (!me) return false;
    return ['MANAGER', 'CONTRIBUTOR'].includes(me.projectRole);
  };

  /* ── filtered tasks ── */
  const filtered = tasks.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.projectName?.toLowerCase().includes(q) ||
      t.assign_to?.toLowerCase().includes(q)
    );
  });

  const getStatusesForTask = (task) => statusesByProject[task.projectId] || [];

  /* ── render ── */
  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Breadcrumb */}
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary-400 transition-colors text-sm font-semibold">
        <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
      </Link>

      {/* Header */}
      <div className={`glass-card p-6 border-l-4 ${config.borderColor}`}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${config.iconBg}`}>
            <CategoryIcon className={`w-7 h-7 ${config.iconColor}`} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{config.label}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{config.description}</p>
          </div>
          <div className="ml-auto shrink-0">
            <span className={`text-3xl font-extrabold ${config.iconColor}`}>
              {loading ? '—' : filtered.length}
            </span>
            <p className="text-slate-500 text-xs text-right">tâche(s)</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Rechercher par titre, projet ou assigné..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#121824]/60 border border-[#1f293d] rounded-xl text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40 transition-all"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className={`w-8 h-8 animate-spin ${config.iconColor}`} />
        </div>
      ) : error ? (
        <div className="glass-card p-6 text-center text-rose-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className={`inline-flex justify-center items-center w-16 h-16 rounded-full ${config.iconBg} mb-4 border border-[#1f293d]`}>
            <CategoryIcon className={`w-8 h-8 ${config.iconColor}`} />
          </div>
          <h3 className="text-slate-300 font-semibold mb-1">
            {search ? 'Aucun résultat' : config.emptyMsg}
          </h3>
          {search && (
            <p className="text-slate-500 text-sm">Essayez un autre terme de recherche.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              config={config}
              canEdit={canEditTask(task)}
              onEditClick={setEditingTask}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          statuses={getStatusesForTask(editingTask)}
          onClose={() => setEditingTask(null)}
          onSaved={() => {
            setEditingTask(null);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
};

export default TasksDetailPage;
