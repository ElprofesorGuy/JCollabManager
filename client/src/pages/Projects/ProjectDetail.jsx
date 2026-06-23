import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft, Plus, Loader2, Users, Trash2, UserPlus, AlertCircle, Settings, Edit2, AlertTriangle, Calendar, Paperclip, Download, Upload, CheckCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axiosConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import TaskComments from './TaskComments';
import GanttView from '../../components/GanttView';
import { AlignLeft, Network } from 'lucide-react';

const taskSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères"),
  description: z.string().min(5, "La description doit faire au moins 5 caractères"),
  assign_to: z.string().email("L'adresse email de l'assigné est invalide").or(z.literal('')),
  status: z.enum(['TO_DO', 'NOT_FINISH', 'END', 'OVERDUE']).optional(),
  dateDebut: z.string().optional(),
  dateEcheance: z.string().optional()
});

const getStatusLabel = (status) => {
  switch (status) {
    case 'TO_DO': return 'À FAIRE';
    case 'NOT_FINISH': return 'EN COURS';
    case 'END': return 'TERMINÉ';
    case 'OVERDUE': return 'EN RETARD';
    default: return status;
  }
};

const formatDate = (dateEcheance) => {
  if (!dateEcheance) return null;
  // Si Jackson renvoie un tableau [2026, 5, 20]
  if (Array.isArray(dateEcheance)) {
    const [y, m, d] = dateEcheance;
    return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
  }
  // Si c'est une chaîne ISO "2026-05-20"
  const parts = String(dateEcheance).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateEcheance;
};

const parseDateToObj = (dateField) => {
  if (!dateField) return null;
  if (Array.isArray(dateField)) {
    const [y, m, d] = dateField;
    return new Date(y, m - 1, d);
  }
  const parts = String(dateField).split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return new Date(dateField);
};

const isSubmissionLate = (subDate, echDate) => {
  if (!subDate || !echDate) return false;
  const s = parseDateToObj(subDate);
  const e = parseDateToObj(echDate);
  s.setHours(0,0,0,0);
  e.setHours(0,0,0,0);
  return s > e;
};

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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' ou 'gantt'
  const [dependencies, setDependencies] = useState([]);
  const [selectedPredecessors, setSelectedPredecessors] = useState([]);

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOwner = user?.email === project?.ownerEmail || user?.username === project?.ownerEmail;
  const isAdmin = user?.role === 'ADMIN';
  const canEdit = isOwner || isAdmin;

  const [selectedTask, setSelectedTask] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [projectError, setProjectError] = useState('');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
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

      // Fetch tasks for this specific project
      const tasksRes = await api.get(`/v1/project/${id}/tasks`);
      const projectTasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      setTasks(projectTasks);

      // Fetch dependencies
      try {
        const depRes = await api.get(`/v1/projects/${id}/dependencies`);
        setDependencies(Array.isArray(depRes.data) ? depRes.data : []);
      } catch(e) {
        console.error("Impossible de charger les dépendances", e);
        setDependencies([]);
      }
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
      // Normalise les dates pour l'input type="date" (format YYYY-MM-DD requis)
      let isoDateEcheance = '';
      if (task.dateEcheance) {
        if (Array.isArray(task.dateEcheance)) {
          const [y, m, d] = task.dateEcheance;
          isoDateEcheance = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        } else {
          isoDateEcheance = String(task.dateEcheance).slice(0, 10);
        }
      }
      
      let isoDateDebut = '';
      if (task.dateDebut) {
        if (Array.isArray(task.dateDebut)) {
          const [y, m, d] = task.dateDebut;
          isoDateDebut = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        } else {
          isoDateDebut = String(task.dateDebut).slice(0, 10);
        }
      }

      let initialPredecessors = [];
      if (task.id) {
        initialPredecessors = dependencies
          .filter(d => d.successorId === task.id)
          .map(d => d.predecessorId);
      }
      setSelectedPredecessors(initialPredecessors);

      reset({
        title: task.title,
        description: task.description,
        assign_to: task.assign_to || '',
        status: task.status,
        dateDebut: isoDateDebut,
        dateEcheance: isoDateEcheance
      });
    } else {
      setSelectedPredecessors([]);
      reset({ title: '', description: '', assign_to: '', status: 'TO_DO', dateDebut: '', dateEcheance: '' });
    }
    setIsTaskModalOpen(true);
  };

  const onTaskSubmit = async (data) => {
    try {
      setTaskError('');

      const newStatus = data.status || 'TO_DO';
      const oldStatus = selectedTask ? selectedTask.status : 'TO_DO';

      if (newStatus === 'END' && oldStatus === 'TO_DO') {
        setTaskError("Impossible de faire passer cette tâche de 'À faire' à 'Terminé' sans passer par 'En cours'.");
        return;
      }

      if (newStatus === 'END' && selectedPredecessors.length > 0) {
        const unfinishedPredecessors = selectedPredecessors
          .map(pId => tasks.find(t => t.id === pId))
          .filter(t => t && t.status !== 'END')
          .map(t => t.title);
          
        if (unfinishedPredecessors.length > 0) {
          setTaskError(`Impossible de marquer cette tâche comme terminée : les tâches préalables suivantes doivent d'abord être terminées : ${unfinishedPredecessors.join(', ')}`);
          return;
        }
      }

      const payload = {
        projectName: project.title,
        title: data.title,
        description: data.description,
        status: data.status || 'TO_DO',
        assign_to: data.assign_to || '',
        dateDebut: data.dateDebut || null,
        dateEcheance: data.dateEcheance || null
      };
      
      let savedTask;
      if (selectedTask) {
        const res = await api.put(`/v1/task/${selectedTask.id}`, payload);
        savedTask = selectedTask; // L'ID reste le même
      } else {
        const res = await api.post(`/v1/task/${project.id}`, payload);
        // Si la création réussit, on doit recharger les tâches pour avoir le nouvel ID si on voulait lier des dépendances immédiatement.
        // Mais comme l'API POST renvoie l'URI dans Location header et non l'objet, c'est complexe de lier à la création.
        // On va se contenter de lier les dépendances uniquement en mode édition pour le moment, ou on les lie par nom.
      }

      // Gestion des dépendances (seulement en édition pour l'instant car on a besoin de l'ID du successeur)
      if (selectedTask) {
        const currentPredecessors = dependencies
          .filter(d => d.successorId === selectedTask.id)
          .map(d => d.predecessorId);
        
        // Supprimer celles qui ont été décochées
        const toDelete = dependencies.filter(d => d.successorId === selectedTask.id && !selectedPredecessors.includes(d.predecessorId));
        for (let dep of toDelete) {
          try { await api.delete(`/v1/tasks/dependencies/${dep.dependencyId}`); } catch(e) {}
        }

        // Ajouter les nouvelles
        const toAdd = selectedPredecessors.filter(pId => !currentPredecessors.includes(pId));
        for (let pId of toAdd) {
          try { await api.post(`/v1/tasks/dependencies`, { predecessorId: pId, successorId: selectedTask.id, projectId: project.id }); } catch(e) {}
        }
      }
      
      setIsTaskModalOpen(false);
      fetchProjectData();
    } catch (err) {
      console.error(err);
      setTaskError(err.response?.data?.message || err.response?.data || "Erreur lors de l'opération sur la tâche.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTask) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingFile(true);
      setTaskError('');
      const res = await api.post(`/v1/task/${selectedTask.id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSelectedTask(res.data);
      fetchProjectData();
    } catch (err) {
      console.error(err);
      setTaskError(err.response?.data?.message || err.response?.data || "Erreur lors du téléversement du fichier.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileDelete = async () => {
    if (!selectedTask || !selectedTask.attachmentUrl) return;

    try {
      setUploadingFile(true);
      setTaskError('');
      const res = await api.delete(`/v1/task/${selectedTask.id}/attachment`);
      setSelectedTask(res.data);
      fetchProjectData();
    } catch (err) {
      console.error(err);
      setTaskError(err.response?.data?.message || err.response?.data || "Erreur lors de la suppression du fichier.");
    } finally {
      setUploadingFile(false);
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

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Titre du projet
    doc.setFontSize(20);
    doc.text(`Projet : ${project.title}`, 14, 22);
    
    // Infos du projet
    doc.setFontSize(12);
    doc.text(`Chef de projet : ${project.ownerName || project.ownerEmail}`, 14, 32);
    doc.text(`Description :`, 14, 42);
    
    doc.setFontSize(10);
    const splitDescription = doc.splitTextToSize(project.description || '', 180);
    doc.text(splitDescription, 14, 48);

    // Tableau des tâches
    const tableData = tasks.map(t => [
      t.title,
      getStatusLabel(t.status),
      t.assign_to || 'Non assigné',
      t.dateEcheance || '-'
    ]);

    let finalY = 48 + (splitDescription.length * 5) + 10;
    
    doc.autoTable({
      startY: finalY,
      head: [['Tâche', 'Statut', 'Assigné à', 'Échéance']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      didParseCell: (data) => {
        if (data.column.index === 1 && data.row.raw && data.row.raw[1] === 'EN RETARD') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    doc.save(`${project.title.replace(/\s+/g, '_')}_rapport.pdf`);
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
  const tasksOverdue = tasks.filter(t => t.status === 'OVERDUE');

  const selectedStatus = watch('status');
  let statusWarning = null;
  if (selectedStatus === 'END') {
    const oldStatus = selectedTask ? selectedTask.status : 'TO_DO';
    if (oldStatus === 'TO_DO') {
      statusWarning = "Attention : Impossible de passer de 'À faire' directement à 'Terminé'.";
    } else if (selectedPredecessors.length > 0) {
      const unfinishedPredecessors = selectedPredecessors
        .map(pId => tasks.find(t => t.id === pId))
        .filter(t => t && t.status !== 'END')
        .map(t => t.title);
      if (unfinishedPredecessors.length > 0) {
        statusWarning = `Attention : Les tâches suivantes doivent être terminées : ${unfinishedPredecessors.join(', ')}`;
      }
    }
  }

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div>
        <Link to="/projects" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary-400 transition-colors mb-4 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Retour aux projets
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <Layers className="w-8 h-8 text-primary-400" />
              {project.title}
              {canEdit && (
                <div className="flex gap-1.5 ml-4 border-l pl-4 border-slate-800">
                  <button onClick={openProjectModal} className="text-slate-400 hover:text-primary-400 p-1.5 transition-colors" title="Modifier le projet">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  {isOwner && (
                    <button onClick={() => setIsDeleteProjectModalOpen(true)} className="text-slate-400 hover:text-rose-400 p-1.5 transition-colors" title="Supprimer le projet">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </h1>
            <p className="text-xs font-semibold text-primary-300 mt-2 bg-primary-500/10 border border-primary-500/20 px-3.5 py-1 rounded-full w-fit">Chef de projet : {project.ownerName || (project.ownerEmail ? project.ownerEmail.split('@')[0] : 'Inconnu')}</p>
            <p className="text-slate-400 mt-3 max-w-2xl text-sm leading-relaxed">{project.description}</p>
          </div>
          <div className="flex gap-2.5">
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-[#121824]/60 border border-[#1f293d] hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-all shadow-sm text-sm font-semibold"
            >
              Exporter PDF
            </button>
            <button 
              onClick={openMembersModal}
              className="flex items-center gap-2 bg-[#121824]/60 border border-[#1f293d] hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-all shadow-sm text-sm font-semibold"
            >
              <Users className="w-4 h-4" />
              Membres
            </button>
            <button 
              onClick={() => openTaskModal()}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Nouvelle tâche
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Vue */}
      <div className="flex items-center gap-1 bg-[#121824]/60 border border-[#1f293d] p-1 rounded-xl w-fit mt-3 mb-8 shadow-sm">
        <button 
          onClick={() => setViewMode('kanban')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'kanban' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <AlignLeft className="w-4 h-4" />
          Tableau Kanban
        </button>
        <button 
          onClick={() => setViewMode('gantt')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'gantt' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Network className="w-4 h-4" />
          Gantt & Dépendances
        </button>
      </div>

      {viewMode === 'gantt' ? (
        <GanttView 
          tasks={tasks} 
          dependencies={dependencies} 
          projectId={id} 
          onTaskClick={openTaskModal} 
          refreshData={fetchProjectData} 
        />
      ) : (
      <>
      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Colonne À Faire */}
        <div className="bg-[#121824]/30 border border-[#1f293d] rounded-2xl p-4 flex flex-col h-[600px] shadow-lg">
          <h3 className="font-bold text-slate-300 mb-4 flex items-center justify-between">
            <span>À Faire</span>
            <span className="bg-slate-800 text-slate-400 border border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">{tasksToDo.length}</span>
          </h3>
          <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {tasksToDo.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4 border border-dashed border-slate-800 rounded-xl">Aucune tâche</p>
            ) : (
              tasksToDo.map(task => (
                <div onClick={() => openTaskModal(task)} key={task.id} className="bg-[#121824]/50 p-4 rounded-xl border border-[#1f293d] hover:border-slate-600 transition-all cursor-pointer border-l-4 border-l-slate-500 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5 group/task relative">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-200 text-sm mb-1 group-hover/task:text-white transition-colors">{task.title}</h4>
                    {isOwner && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover/task:opacity-100 transition-opacity p-1"
                        title="Supprimer la tâche"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                    {task.assign_to && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-md">
                        <Users className="w-3 h-3" />
                        <span>{task.assign_to.split('@')[0]}</span>
                      </div>
                    )}
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${task.dateEcheance ? 'text-slate-400 bg-slate-800/80 border border-slate-700' : 'text-slate-500 bg-slate-900/50 italic border border-slate-800'}`}>
                      <Calendar className="w-3 h-3" />
                      <span>{task.dateEcheance ? formatDate(task.dateEcheance) : 'Pas d\'échéance'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Colonne En Cours */}
        <div className="bg-[#121824]/30 border border-[#1f293d] rounded-2xl p-4 flex flex-col h-[600px] shadow-lg">
          <h3 className="font-bold text-slate-300 mb-4 flex items-center justify-between">
            <span>En Cours</span>
            <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">{tasksInProgress.length}</span>
          </h3>
          <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {tasksInProgress.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4 border border-dashed border-slate-800 rounded-xl">Aucune tâche</p>
            ) : (
              tasksInProgress.map(task => (
                <div onClick={() => openTaskModal(task)} key={task.id} className="bg-[#121824]/50 p-4 rounded-xl border border-[#1f293d] hover:border-slate-600 transition-all cursor-pointer border-l-4 border-l-cyan-500 hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-0.5 group/task relative">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-200 text-sm mb-1 group-hover/task:text-white transition-colors">{task.title}</h4>
                    {isOwner && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover/task:opacity-100 transition-opacity p-1"
                        title="Supprimer la tâche"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                    {task.assign_to && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                        <Users className="w-3 h-3" />
                        <span>{task.assign_to.split('@')[0]}</span>
                      </div>
                    )}
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${task.dateEcheance ? 'text-slate-400 bg-slate-800/80 border border-slate-700' : 'text-slate-500 bg-slate-900/50 italic border border-slate-800'}`}>
                      <Calendar className="w-3 h-3" />
                      <span>{task.dateEcheance ? formatDate(task.dateEcheance) : 'Pas d\'échéance'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Colonne Terminé */}
        <div className="bg-[#121824]/30 border border-[#1f293d] rounded-2xl p-4 flex flex-col h-[600px] shadow-lg">
          <h3 className="font-bold text-slate-300 mb-4 flex items-center justify-between">
            <span>Terminé</span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">{tasksDone.length}</span>
          </h3>
          <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {tasksDone.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4 border border-dashed border-slate-800 rounded-xl">Aucune tâche</p>
            ) : (
              tasksDone.map(task => (
                <div onClick={() => openTaskModal(task)} key={task.id} className="bg-[#121824]/30 p-4 rounded-xl border border-[#1f293d] hover:border-slate-600 transition-all cursor-pointer border-l-4 border-l-emerald-500 opacity-60 hover:opacity-95 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 group/task relative">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-400 text-sm mb-1 line-through decoration-slate-600 group-hover/task:text-white transition-colors">{task.title}</h4>
                    {isOwner && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover/task:opacity-100 transition-opacity p-1"
                        title="Supprimer la tâche"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                    {task.assign_to && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md opacity-75">
                        <Users className="w-3 h-3" />
                        <span>{task.assign_to.split('@')[0]}</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5 w-full mt-2">
                      {task.dateEcheance && (
                        <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md opacity-75 text-slate-400 bg-slate-800/80 border border-slate-700 w-fit">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Échéance : {formatDate(task.dateEcheance)}</span>
                        </div>
                      )}
                      {task.submissionDate ? (
                        <div className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md w-fit ${
                          isSubmissionLate(task.submissionDate, task.dateEcheance)
                            ? 'text-rose-400 bg-rose-500/15 border border-rose-500/25'
                            : 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/25'
                        }`}>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>
                            Remis le {formatDate(task.submissionDate)}
                            {isSubmissionLate(task.submissionDate, task.dateEcheance) && ' (En Retard)'}
                          </span>
                        </div>
                      ) : (
                        !task.dateEcheance && (
                          <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md opacity-75 text-slate-500 bg-slate-900/50 italic border border-slate-800 w-fit">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Pas d'échéance</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Colonne En Retard */}
        <div className="bg-[#121824]/30 border border-[#1f293d] rounded-2xl p-4 flex flex-col h-[600px] shadow-lg">
          <h3 className="font-bold text-slate-300 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" />En Retard</span>
            <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">{tasksOverdue.length}</span>
          </h3>
          <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {tasksOverdue.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4 border border-dashed border-slate-800 rounded-xl">Aucune tâche</p>
            ) : (
              tasksOverdue.map(task => (
                <div onClick={() => openTaskModal(task)} key={task.id} className="bg-[#121824]/50 p-4 rounded-xl border border-[#1f293d] hover:border-slate-600 transition-all cursor-pointer border-l-4 border-l-rose-500 hover:shadow-lg hover:shadow-rose-500/5 hover:-translate-y-0.5 group/task relative">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-rose-400 text-sm mb-1 group-hover/task:text-rose-300 transition-colors">{task.title}</h4>
                    {isOwner && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover/task:opacity-100 transition-opacity p-1"
                        title="Supprimer la tâche"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                    {task.assign_to && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                        <Users className="w-3 h-3" />
                        <span>{task.assign_to.split('@')[0]}</span>
                      </div>
                    )}
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${task.dateEcheance ? 'text-rose-400 bg-rose-500/15 border border-rose-500/25 font-bold' : 'text-slate-500 bg-slate-900/50 italic border border-slate-800'}`}>
                      <Calendar className="w-3 h-3" />
                      <span>{task.dateEcheance ? formatDate(task.dateEcheance) : 'Pas d\'échéance'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      </>
      )}

      {/* Modal Membres */}
      {isMembersModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1f293d] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-[#1f293d] flex justify-between items-center bg-[#121824]/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-400" />
                Membres du projet
              </h2>
              <button onClick={() => setIsMembersModalOpen(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="p-6">
              {memberError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2">
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
                  className="flex-grow px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600"
                />
                <button 
                  type="submit" 
                  disabled={loadingMembers || !newMemberEmail}
                  className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 text-sm font-semibold shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  Ajouter
                </button>
              </form>

              {loadingMembers && members.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-slate-500 text-center py-4 text-sm">Aucun membre trouvé.</p>
              ) : (
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {members.map(member => (
                    <li key={member.id} className="flex items-center justify-between p-3 bg-[#121824]/40 rounded-xl border border-[#1f293d] group hover:border-slate-700 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-200 text-sm">{member.username || (member.email ? member.email.split('@')[0] : 'Membre')}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {project.ownerEmail === member.email ? (
                          <span className="bg-primary-500/15 text-primary-400 border border-primary-500/25 text-[10px] font-bold px-2 py-1 rounded">Chef de projet</span>
                        ) : (
                          <>
                            <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold px-2 py-1 rounded">Membre</span>
                            <button 
                              onClick={() => onRemoveMember(member.email)}
                              disabled={loadingMembers}
                              title="Retirer ce membre"
                              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1f293d] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-[#1f293d] flex justify-between items-center bg-[#121824]/50 shrink-0">
              <h2 className="text-lg font-bold text-white">
                {selectedTask ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
              </h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleSubmit(onTaskSubmit)} className="p-6 space-y-4">
              {taskError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{taskError}</span>
                </div>
              )}
              {statusWarning && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{statusWarning}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Statut</label>
                <select 
                  {...register('status')}
                  className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm"
                >
                  <option value="TO_DO">À Faire</option>
                  <option value="NOT_FINISH">En Cours</option>
                  <option value="END">Terminé</option>
                  {selectedTask && <option value="OVERDUE">En Retard</option>}
                </select>
              </div>
              {selectedTask && selectedTask.submissionDate && (
                <div className="bg-[#121824]/40 p-3.5 rounded-xl border border-[#1f293d] text-xs space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Informations de livraison</span>
                  <div className="flex justify-between items-center font-semibold text-slate-300">
                    <span>Date de remise :</span>
                    <span className={
                      isSubmissionLate(selectedTask.submissionDate, selectedTask.dateEcheance)
                        ? 'text-rose-400 font-bold'
                        : 'text-emerald-400 font-bold'
                    }>
                      {formatDate(selectedTask.submissionDate)}
                      {isSubmissionLate(selectedTask.submissionDate, selectedTask.dateEcheance) && ' (En retard)'}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Titre de la tâche</label>
                <input 
                  {...register('title')} 
                  className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.title ? 'border-rose-500' : 'border-[#1f293d]'}`}
                  placeholder="Ex: Refonte du bouton de connexion"
                />
                {errors.title && <p className="text-rose-400 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea 
                  {...register('description')} 
                  rows={3}
                  placeholder="Expliquez brièvement la tâche..."
                  className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.description ? 'border-rose-500' : 'border-[#1f293d]'}`}
                />
                {errors.description && <p className="text-rose-400 text-xs mt-1">{errors.description.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assigner à (Email) <span className="text-slate-500 font-normal">- Optionnel</span></label>
                <input 
                  type="email"
                  {...register('assign_to')} 
                  className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.assign_to ? 'border-rose-400' : 'border-[#1f293d]'}`}
                  placeholder={project?.ownerEmail}
                />
                {errors.assign_to && <p className="text-rose-400 text-xs mt-1">{errors.assign_to.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Date de début</span>
                  </label>
                  <input 
                    type="date"
                    {...register('dateDebut')} 
                    className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Date d'échéance</span>
                  </label>
                  <input 
                    type="date"
                    {...register('dateEcheance')} 
                    className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm"
                  />
                </div>
              </div>

              {/* Sélection des dépendances (prédécesseurs) */}
              {selectedTask && tasks.length > 1 && (
                <div className="bg-[#121824]/40 p-4 rounded-xl border border-[#1f293d]">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Network className="w-4 h-4 text-primary-400" />
                    Dépendances (Tâches Préalables)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3">Sélectionnez les tâches qui doivent être terminées avant de commencer celle-ci.</p>
                  <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {tasks.filter(t => t.id !== selectedTask.id).map(t => (
                      <label key={t.id} className="flex items-start gap-2.5 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="mt-1 rounded border-slate-700 bg-slate-900 text-primary-600 focus:ring-primary-500"
                          checked={selectedPredecessors.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPredecessors([...selectedPredecessors, t.id]);
                            } else {
                              setSelectedPredecessors(selectedPredecessors.filter(id => id !== t.id));
                            }
                          }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-300 group-hover:text-primary-400 transition-colors">{t.title}</p>
                          <p className="text-xs text-slate-500">{getStatusLabel(t.status)}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1f293d]/50">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-slate-400 font-semibold hover:bg-slate-800/50 rounded-xl transition-colors text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-sm shadow-md">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {selectedTask ? 'Mettre à jour' : 'Créer la tâche'}
                </button>
              </div>
            </form>
            
            {/* Section Pièce jointe */}
            {selectedTask && (
              <div className="px-6 pb-4 pt-4 border-t border-[#1f293d]">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-primary-400" />
                  Pièce jointe
                </h3>
                
                {selectedTask.attachmentUrl ? (
                  <div className="flex items-center justify-between bg-[#121824]/40 p-3 rounded-xl border border-[#1f293d]">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-lg">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-slate-300 truncate" title={selectedTask.attachmentUrl}>
                        {selectedTask.attachmentUrl.split('/').pop()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <a 
                        href={`http://localhost:9000/uploads/${selectedTask.attachmentUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                        title="Télécharger / Voir"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <label className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer" title="Remplacer">
                        {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                      </label>
                      <button 
                        type="button"
                        onClick={handleFileDelete}
                        disabled={uploadingFile}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center border border-dashed border-[#1f293d] hover:border-slate-700 bg-[#121824]/20 hover:bg-[#121824]/40 rounded-xl p-6 transition-colors">
                    <label className="flex flex-col items-center gap-2 cursor-pointer w-full">
                      {uploadingFile ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                      ) : (
                        <>
                          <div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-xl">
                            <Upload className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-semibold text-slate-300">Cliquez pour ajouter un fichier</span>
                          <span className="text-[10px] text-slate-500">PDF, Images, etc. (max 10MB)</span>
                        </>
                      )}
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                    </label>
                  </div>
                )}
              </div>
            )}
            
            {/* Commentaires de la tâche (seulement si la tâche existe déjà) */}
            {selectedTask && (
              <div className="px-6 pb-6 pt-2 border-t border-[#1f293d]/50">
                <TaskComments taskId={selectedTask.id} />
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Edition Projet */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1f293d] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-[#1f293d] flex justify-between items-center bg-[#121824]/50">
              <h2 className="text-lg font-bold text-white">Modifier le projet</h2>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmitProject(onEditProjectSubmit)} className="p-6 space-y-5">
              {projectError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{projectError}</span>
                </div>
              )}
              {isOwner && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Titre du projet</label>
                    <input 
                      {...registerProject('title')} 
                      className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm ${projectErrors.title ? 'border-rose-500' : 'border-[#1f293d]'}`}
                    />
                    {projectErrors.title && <p className="text-rose-400 text-xs mt-1">{projectErrors.title.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea 
                      {...registerProject('description')} 
                      rows={4}
                      className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm ${projectErrors.description ? 'border-rose-500' : 'border-[#1f293d]'}`}
                    />
                    {projectErrors.description && <p className="text-rose-400 text-xs mt-1">{projectErrors.description.message}</p>}
                  </div>
                </>
              )}
              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email du Chef de projet (Owner)</label>
                  <input 
                    {...registerProject('ownerEmail')} 
                    type="email"
                    className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm ${projectErrors.ownerEmail ? 'border-rose-500' : 'border-[#1f293d]'}`}
                  />
                  {projectErrors.ownerEmail && <p className="text-rose-400 text-xs mt-1">{projectErrors.ownerEmail.message}</p>}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#1f293d]/50">
                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-slate-400 font-semibold hover:bg-slate-800/50 rounded-xl transition-colors text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={isProjectSubmitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-sm shadow-md">
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-rose-500/30 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-rose-500/20 flex justify-between items-center bg-rose-950/20">
              <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Supprimer le projet
              </h2>
              <button onClick={() => setIsDeleteProjectModalOpen(false)} className="text-rose-400 hover:text-rose-300 text-xl">×</button>
            </div>
            <div className="p-6">
              <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement le projet <strong className="text-white">{project?.title}</strong> ? Cette action est irréversible et supprimera toutes les tâches associées.
              </p>
              <div className="flex justify-end gap-3 pt-3 border-t border-[#1f293d]/50">
                <button type="button" onClick={() => setIsDeleteProjectModalOpen(false)} className="px-4 py-2 text-slate-400 font-semibold hover:bg-slate-800/50 border border-[#1f293d] rounded-xl transition-colors text-sm">
                  Annuler
                </button>
                <button type="button" onClick={onDeleteProject} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 text-sm shadow-md">
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
