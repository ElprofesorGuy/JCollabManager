import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft, Plus, Loader2, Users, Trash2, UserPlus, AlertCircle, Settings, Edit2 } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axiosConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const taskSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères"),
  description: z.string().min(5, "La description doit faire au moins 5 caractères"),
  assign_to: z.string().email("L'adresse email de l'assigné est invalide").or(z.literal('')),
  status: z.enum(['TO_DO', 'NOT_FINISH', 'END']).optional()
});

const projectSchema = z.object({
  title: z.string().min(3, "Titre requis").optional(),
  description: z.string().min(5, "Description requise").optional(),
  ownerEmail: z.string().email("Email invalide").optional()
});

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');
  const [taskError, setTaskError] = useState('');

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOwner = user?.email === project?.ownerEmail || user?.username === project?.ownerEmail;
  const isAdmin = user?.role === 'ADMIN';
  const canEdit = isOwner || isAdmin;

  const [selectedTask, setSelectedTask] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [projectError, setProjectError] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskSchema)
  });

  const { register: registerProject, handleSubmit: handleSubmitProject, reset: resetProject, formState: { errors: projectErrors, isSubmitting: isProjectSubmitting } } = useForm({
    resolver: zodResolver(projectSchema)
  });

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      // Fetch project details
      const projectRes = await api.get(`/v1/project/${id}`);
      setProject(projectRes.data);

      // Fetch all tasks and filter by project name (since task endpoint returns all tasks)
      const tasksRes = await api.get('/v1/task');
      const safeTasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      const projectTasks = safeTasks.filter(t => t.projectName === projectRes.data.title);
      setTasks(projectTasks);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les détails du projet.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await api.get(`/v1/project/${id}/members`);
      const safeMembers = Array.isArray(res.data) ? res.data : [];
      setMembers(safeMembers);
    } catch (err) {
      console.error("Erreur lors de la récupération des membres", err);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const openMembersModal = () => {
    setIsMembersModalOpen(true);
    fetchMembers();
  };

  const openTaskModal = (task = null) => {
    setTaskError('');
    setSelectedTask(task);
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        assign_to: task.assign_to || '',
        status: task.status
      });
    } else {
      reset({ title: '', description: '', assign_to: '', status: 'TO_DO' });
    }
    setIsTaskModalOpen(true);
  };

  const onTaskSubmit = async (data) => {
    try {
      setTaskError('');
      const payload = {
        projectName: project.title,
        title: data.title,
        description: data.description,
        status: data.status || 'TO_DO',
        assign_to: data.assign_to || ''
      };
      
      if (selectedTask) {
        await api.put(`/v1/task/${selectedTask.id}`, payload);
      } else {
        await api.post(`/v1/task/${project.id}`, payload);
      }
      
      setIsTaskModalOpen(false);
      fetchProjectData();
    } catch (err) {
      console.error(err);
      setTaskError(err.response?.data?.message || err.response?.data || "Erreur lors de l'opération sur la tâche.");
    }
  };

  const onAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    try {
      setMemberError('');
      setLoadingMembers(true);
      await api.post(`/v1/project/${id}/members`, [newMemberEmail]);
      setNewMemberEmail('');
      await fetchMembers();
    } catch (err) {
      console.error(err);
      setMemberError(err.response?.data?.message || err.response?.data || "Erreur lors de l'ajout du membre.");
    } finally {
      setLoadingMembers(false);
    }
  };

  const onRemoveMember = async (email) => {
    try {
      setMemberError('');
      setLoadingMembers(true);
      await api.delete(`/v1/project/${id}/members`, { data: [email] });
      await fetchMembers();
    } catch (err) {
      console.error(err);
      setMemberError(err.response?.data?.message || err.response?.data || "Erreur lors de la suppression du membre.");
    } finally {
      setLoadingMembers(false);
    }
  };

  const onDeleteTask = async (taskId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;
    try {
      await api.delete(`/v1/task/${taskId}`);
      fetchProjectData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.response?.data || "Erreur lors de la suppression de la tâche.");
    }
  };

  const onEditProjectSubmit = async (data) => {
    try {
      setProjectError('');
      const payload = {
        ...project,
        title: isOwner ? data.title : project.title,
        description: isOwner ? data.description : project.description,
        ownerEmail: isAdmin ? data.ownerEmail : project.ownerEmail
      };
      await api.put(`/v1/project/${id}`, payload);
      setIsProjectModalOpen(false);
      fetchProjectData();
    } catch (err) {
      console.error(err);
      setProjectError(err.response?.data?.message || err.response?.data || "Erreur lors de la modification du projet.");
    }
  };

  const onDeleteProject = async () => {
    try {
      await api.delete(`/v1/project/${id}`);
      navigate('/projects');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.response?.data || "Erreur lors de la suppression du projet.");
    }
  };

  const openProjectModal = () => {
    resetProject({
      title: project.title,
      description: project.description,
      ownerEmail: project.ownerEmail
    });
    setIsProjectModalOpen(true);
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  if (error || !project) return (
    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
      <p>{error || 'Projet introuvable'}</p>
      <Link to="/projects" className="text-primary-600 underline mt-2 inline-block">Retour aux projets</Link>
    </div>
  );

  // Group tasks by status
  const tasksToDo = tasks.filter(t => t.status === 'TO_DO');
  const tasksInProgress = tasks.filter(t => t.status === 'NOT_FINISH');
  const tasksDone = tasks.filter(t => t.status === 'END');

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link to="/projects" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors mb-4 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Retour aux projets
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Layers className="w-8 h-8 text-primary-600" />
              {project.title}
              {canEdit && (
                <div className="flex gap-1 ml-4 border-l pl-4 border-slate-200">
                  <button onClick={openProjectModal} className="text-slate-400 hover:text-primary-600 p-1.5 transition-colors" title="Modifier le projet">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  {isOwner && (
                    <button onClick={() => setIsDeleteProjectModalOpen(true)} className="text-slate-400 hover:text-red-600 p-1.5 transition-colors" title="Supprimer le projet">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </h1>
            <p className="text-sm font-medium text-primary-600 mt-2 bg-primary-50 px-3 py-1 rounded-full w-fit">Chef de projet : {project.ownerName || project.ownerEmail.split('@')[0]}</p>
            <p className="text-slate-500 mt-3 max-w-2xl">{project.description}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={openMembersModal}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              Membres
            </button>
            <button 
              onClick={() => openTaskModal()}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouvelle tâche
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board (Affichage simple pour le moment) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        
        {/* Colonne À Faire */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col h-[600px] shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
            <span>À Faire</span>
            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{tasksToDo.length}</span>
          </h3>
          <div className="flex-grow overflow-y-auto space-y-3">
            {tasksToDo.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">Aucune tâche</p>
            ) : (
              tasksToDo.map(task => (
                <div onClick={() => openTaskModal(task)} key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-slate-400 transition-colors cursor-pointer border-l-4 border-l-slate-400 group/task relative">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{task.title}</h4>
                    {isOwner && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-opacity p-1"
                        title="Supprimer la tâche"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs line-clamp-2 mb-2">{task.description}</p>
                  {task.assign_to && (
                    <div className="flex items-center gap-1 text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full w-fit">
                      <Users className="w-3 h-3" />
                      <span>{task.assign_to.split('@')[0]}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Colonne En Cours */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col h-[600px] shadow-sm">
          <h3 className="font-bold text-blue-900 mb-4 flex items-center justify-between">
            <span>En Cours</span>
            <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">{tasksInProgress.length}</span>
          </h3>
          <div className="flex-grow overflow-y-auto space-y-3">
            {tasksInProgress.length === 0 ? (
              <p className="text-blue-400/70 text-sm text-center py-4 border-2 border-dashed border-blue-200 rounded-lg">Aucune tâche</p>
            ) : (
              tasksInProgress.map(task => (
                <div onClick={() => openTaskModal(task)} key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-blue-200 hover:border-blue-400 transition-colors cursor-pointer border-l-4 border-l-blue-500 group/task relative">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{task.title}</h4>
                    {isOwner && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        className="text-blue-300 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-opacity p-1"
                        title="Supprimer la tâche"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs line-clamp-2 mb-2">{task.description}</p>
                  {task.assign_to && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                      <Users className="w-3 h-3" />
                      <span>{task.assign_to.split('@')[0]}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Colonne Terminé */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col h-[600px] shadow-sm">
          <h3 className="font-bold text-emerald-900 mb-4 flex items-center justify-between">
            <span>Terminé</span>
            <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full text-xs">{tasksDone.length}</span>
          </h3>
          <div className="flex-grow overflow-y-auto space-y-3">
            {tasksDone.length === 0 ? (
              <p className="text-emerald-400/70 text-sm text-center py-4 border-2 border-dashed border-emerald-200 rounded-lg">Aucune tâche</p>
            ) : (
              tasksDone.map(task => (
                <div onClick={() => openTaskModal(task)} key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-emerald-200 hover:border-emerald-400 transition-colors cursor-pointer border-l-4 border-l-emerald-500 opacity-80 group/task relative">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-sm mb-1 line-through decoration-slate-400">{task.title}</h4>
                    {isOwner && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        className="text-emerald-300 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-opacity p-1"
                        title="Supprimer la tâche"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs line-clamp-2 mb-2">{task.description}</p>
                  {task.assign_to && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit opacity-75">
                      <Users className="w-3 h-3" />
                      <span>{task.assign_to.split('@')[0]}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal Membres */}
      {isMembersModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                Membres du projet
              </h2>
              <button onClick={() => setIsMembersModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="p-6">
              {memberError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{memberError}</span>
                </div>
              )}
              
              <form onSubmit={onAddMember} className="mb-6 flex gap-2">
                <input 
                  type="email" 
                  required
                  placeholder="Email du nouveau membre..." 
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="flex-grow px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <button 
                  type="submit" 
                  disabled={loadingMembers || !newMemberEmail}
                  className="bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Ajouter
                </button>
              </form>

              {loadingMembers && members.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-slate-500 text-center py-4">Aucun membre trouvé.</p>
              ) : (
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {members.map(member => (
                    <li key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-slate-200 transition-colors">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{member.username || member.email.split('@')[0]}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {project.ownerEmail === member.email ? (
                          <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded">Chef de projet</span>
                        ) : (
                          <>
                            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded">Membre</span>
                            <button 
                              onClick={() => onRemoveMember(member.email)}
                              disabled={loadingMembers}
                              title="Retirer ce membre"
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Création Tâche */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedTask ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
              </h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleSubmit(onTaskSubmit)} className="p-6">
              {taskError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{taskError}</span>
                </div>
              )}
              {selectedTask && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                  <select 
                    {...register('status')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="TO_DO">À Faire</option>
                    <option value="NOT_FINISH">En Cours</option>
                    <option value="END">Terminé</option>
                  </select>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre de la tâche</label>
                <input 
                  {...register('title')} 
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.title ? 'border-red-500' : 'border-slate-300'}`}
                  placeholder="Ex: Refonte du bouton de connexion"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  {...register('description')} 
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.description ? 'border-red-500' : 'border-slate-300'}`}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Assigner à (Email) <span className="text-slate-400 font-normal">- Optionnel</span></label>
                <input 
                  type="email"
                  {...register('assign_to')} 
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.assign_to ? 'border-red-500' : 'border-slate-300'}`}
                  placeholder={project?.ownerEmail}
                />
                {errors.assign_to && <p className="text-red-500 text-xs mt-1">{errors.assign_to.message}</p>}
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {selectedTask ? 'Mettre à jour' : 'Créer la tâche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edition Projet */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Modifier le projet</h2>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleSubmitProject(onEditProjectSubmit)} className="p-6">
              {projectError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{projectError}</span>
                </div>
              )}
              {isOwner && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Titre du projet</label>
                    <input 
                      {...registerProject('title')} 
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${projectErrors.title ? 'border-red-500' : 'border-slate-300'}`}
                    />
                    {projectErrors.title && <p className="text-red-500 text-xs mt-1">{projectErrors.title.message}</p>}
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                      {...registerProject('description')} 
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${projectErrors.description ? 'border-red-500' : 'border-slate-300'}`}
                    />
                    {projectErrors.description && <p className="text-red-500 text-xs mt-1">{projectErrors.description.message}</p>}
                  </div>
                </>
              )}
              {isAdmin && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email du Chef de projet (Owner)</label>
                  <input 
                    {...registerProject('ownerEmail')} 
                    type="email"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${projectErrors.ownerEmail ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {projectErrors.ownerEmail && <p className="text-red-500 text-xs mt-1">{projectErrors.ownerEmail.message}</p>}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={isProjectSubmitting} className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isProjectSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Suppression Projet */}
      {isDeleteProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
              <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Supprimer le projet
              </h2>
              <button onClick={() => setIsDeleteProjectModalOpen(false)} className="text-red-400 hover:text-red-600">×</button>
            </div>
            <div className="p-6">
              <p className="text-slate-700 mb-6 text-sm">
                Êtes-vous sûr de vouloir supprimer définitivement le projet <strong>{project?.title}</strong> ? Cette action est irréversible et supprimera toutes les tâches associées.
              </p>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsDeleteProjectModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors text-sm">
                  Annuler
                </button>
                <button type="button" onClick={onDeleteProject} className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm shadow-sm">
                  <Trash2 className="w-4 h-4" />
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
