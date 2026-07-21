import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layers, ArrowLeft, Plus, Loader2, Users, Trash2, UserPlus, AlertCircle, Edit2, AlertTriangle, Calendar, Paperclip, Download, Upload, CheckCircle, Pencil, Check, X } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import api from "../../api/axiosConfig";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import jsPDF from "jspdf";
import "jspdf-autotable";
import TaskComments from "./TaskComments";
import GanttView from "../../components/GanttView";
import { AlignLeft, Network } from "lucide-react";

const taskSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caracteres"),
  description: z.string().min(5, "La description doit faire au moins 5 caracteres"),
  assign_to: z.string().optional(),
  workflowStatus: z.string().optional(),
  taskType: z.enum(["EPIC", "STORY", "TASK", "SUBTASK"]).optional(),
  parentTaskName: z.string().optional(),
  dateDebut: z.string().optional(),
  dateEcheance: z.string().optional()
});

const formatDate = (dateEcheance) => {
  if (!dateEcheance) return null;
  if (Array.isArray(dateEcheance)) {
    const [y, m, d] = dateEcheance;
    return `${String(d).padStart(2,"0")}/${String(m).padStart(2,"0")}/${y}`;
  }
  const parts = String(dateEcheance).split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateEcheance;
};

const parseDateToObj = (dateField) => {
  if (!dateField) return null;
  if (Array.isArray(dateField)) {
    const [y, m, d] = dateField;
    return new Date(y, m - 1, d);
  }
  const parts = String(dateField).split("-");
  if (parts.length === 3) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return new Date(dateField);
};

const isSubmissionLate = (subDate, echDate) => {
  if (!subDate || !echDate) return false;
  const s = parseDateToObj(subDate);
  const e = parseDateToObj(echDate);
  s.setHours(0,0,0,0); e.setHours(0,0,0,0);
  return s > e;
};

const projectSchema = z.object({
  title: z.string().min(3, "Titre requis").optional(),
  description: z.string().min(5, "Description requise").optional(),
  managerEmail: z.string().email("Email invalide").optional()
});

const TaskTypeBadge = ({ type }) => {
  if (!type) return null;
  const config = {
    EPIC: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: "ðŸ’Ž" },
    STORY: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: "ðŸ“˜" },
    TASK: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: "ðŸ“" },
    SUBTASK: { color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: "â†³" }
  };
  const current = config[type] || config.TASK;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold flex items-center gap-1 w-fit ${current.color}`}>
      {current.icon} {type}
    </span>
  );
};

const COLUMN_COLORS = [
  { border: "border-l-slate-500", badge: "bg-slate-800 text-slate-400 border-slate-700", assignee: "text-primary-400 bg-primary-500/10 border-primary-500/20" },
  { border: "border-l-cyan-500",  badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", assignee: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  { border: "border-l-emerald-500", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", assignee: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { border: "border-l-rose-500", badge: "bg-rose-500/20 text-rose-400 border-rose-500/30", assignee: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  { border: "border-l-amber-500", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", assignee: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { border: "border-l-violet-500", badge: "bg-violet-500/20 text-violet-400 border-violet-500/30", assignee: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
];

const PROJECT_ROLES = ["MANAGER", "CONTRIBUTOR", "REVIEWER", "VIEWER"];

const getColorForIndex = (i) => COLUMN_COLORS[i % COLUMN_COLORS.length];

const KanbanColumn = ({ status, colorConfig, tasks, isOwner, onTaskClick, onDeleteTask, onRenameStatus, canEdit }) => {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(status.name);
  const inputRef = useRef(null);

  const startEdit = () => {
    if (!canEdit) return;
    setEditing(true);
    setNewName(status.name);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const cancelEdit = () => { setEditing(false); setNewName(status.name); };

  const confirmEdit = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === status.name) { cancelEdit(); return; }
    await onRenameStatus(status.id, trimmed, status.orderIndex, status.completed);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") confirmEdit();
    if (e.key === "Escape") cancelEdit();
  };

  return (
    <div className="bg-[#121824]/30 border border-[#1f293d] rounded-2xl p-4 flex flex-col h-[600px] shadow-lg min-w-[260px]">
      <h3 className="font-bold text-slate-300 mb-4 flex items-center justify-between gap-2">
        {editing ? (
          <div className="flex items-center gap-1 flex-1">
            <input ref={inputRef} value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={handleKeyDown}
              className="bg-[#0f172a] border border-primary-500/50 rounded-lg px-2 py-0.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500 w-full" />
            <button onClick={confirmEdit} className="text-emerald-400 hover:text-emerald-300 p-1"><Check className="w-4 h-4" /></button>
            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-200 p-1"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <span className="flex items-center gap-2 group/col" onClick={startEdit} title={canEdit ? "Cliquer pour renommer" : ""} style={{ cursor: canEdit ? "pointer" : "default" }}>
            {status.name}
            {canEdit && <Pencil className="w-3 h-3 text-slate-600 opacity-0 group-hover/col:opacity-100 transition-opacity" />}
          </span>
        )}
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border shrink-0 ${colorConfig.badge}`}>{tasks.length}</span>
      </h3>
      <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar pr-1">
        {tasks.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-4 border border-dashed border-slate-800 rounded-xl">Aucune tache</p>
        ) : (
          tasks.map(task => (
            <div onClick={() => onTaskClick(task)} key={task.id}
              className={`bg-[#121824]/50 p-4 rounded-xl border border-[#1f293d] hover:border-slate-600 transition-all cursor-pointer border-l-4 ${colorConfig.border} hover:shadow-lg hover:-translate-y-0.5 group/task relative`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-200 text-sm mb-1 group-hover/task:text-white transition-colors">{task.title}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    {task.taskType && <TaskTypeBadge type={task.taskType} />}
                    {task.parentTaskName && <span className="text-[10px] text-slate-500 font-medium">Parent: {task.parentTaskName}</span>}
                  </div>
                </div>
                {isOwner && (
                  <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                    className="text-slate-500 hover:text-rose-400 opacity-0 group-hover/task:opacity-100 transition-opacity p-1" title="Supprimer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                {task.assign_to && (
                  <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${colorConfig.assignee}`}>
                    <Users className="w-3 h-3" />
                    <span>{task.assign_to.split("@")[0]}</span>
                  </div>
                )}
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${task.dateEcheance ? "text-slate-400 bg-slate-800/80 border border-slate-700" : "text-slate-500 bg-slate-900/50 italic border border-slate-800"}`}>
                  <Calendar className="w-3 h-3" />
                  <span>{task.dateEcheance ? formatDate(task.dateEcheance) : "Pas d echeance"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("CONTRIBUTOR");
  const [memberError, setMemberError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [viewMode, setViewMode] = useState("kanban");
  const [dependencies, setDependencies] = useState([]);
  const [selectedPredecessors, setSelectedPredecessors] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOwner = user?.email === project?.managerEmail || user?.username === project?.managerEmail;
  const isAdmin = user?.role === "ADMIN";
  const canEdit = isOwner || isAdmin;
  const [selectedTask, setSelectedTask] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [projectError, setProjectError] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(taskSchema) });
  const { register: registerProject, handleSubmit: handleSubmitProject, reset: resetProject, formState: { errors: projectErrors, isSubmitting: isProjectSubmitting } } = useForm({ resolver: zodResolver(projectSchema) });

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const projectRes = await api.get(`/v1/project/${id}`);
      setProject(projectRes.data);
      const tasksRes = await api.get(`/v1/project/${id}/tasks`);
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      try {
        const statusRes = await api.get(`/v1/projects/${id}/statuses`);
        const sorted = (Array.isArray(statusRes.data) ? statusRes.data : []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
        setStatuses(sorted);
      } catch (e) { setStatuses([]); }
      try {
        const depRes = await api.get(`/v1/projects/${id}/dependencies`);
        setDependencies(Array.isArray(depRes.data) ? depRes.data : []);
      } catch(e) { setDependencies([]); }
    } catch (err) {
      setError("Impossible de charger les details du projet.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await api.get(`/v1/project/${id}/members`);
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const openMembersModal = () => { setIsMembersModalOpen(true); fetchMembers(); };

  const openTaskModal = (task = null) => {
    setTaskError("");
    setSelectedTask(task);
    if (task) {
      let isoDateEcheance = "";
      if (task.dateEcheance) {
        if (Array.isArray(task.dateEcheance)) { const [y,m,d] = task.dateEcheance; isoDateEcheance = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
        else { isoDateEcheance = String(task.dateEcheance).slice(0, 10); }
      }
      let isoDateDebut = "";
      if (task.dateDebut) {
        if (Array.isArray(task.dateDebut)) { const [y,m,d] = task.dateDebut; isoDateDebut = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
        else { isoDateDebut = String(task.dateDebut).slice(0, 10); }
      }
      setSelectedPredecessors(task.id ? dependencies.filter(d => d.successorId === task.id).map(d => d.predecessorId) : []);
      reset({ title: task.title, description: task.description, assign_to: task.assign_to || "", workflowStatus: task.workflowStatus || (statuses[0]?.name || ""), taskType: task.taskType || "TASK", parentTaskName: task.parentTaskName || "", dateDebut: isoDateDebut, dateEcheance: isoDateEcheance });
    } else {
      setSelectedPredecessors([]);
      reset({ title: "", description: "", assign_to: "", workflowStatus: statuses[0]?.name || "", taskType: "TASK", parentTaskName: "", dateDebut: "", dateEcheance: "" });
    }
    setIsTaskModalOpen(true);
  };

  const onTaskSubmit = async (data) => {
    try {
      setTaskError("");
      const payload = { projectName: project.title, title: data.title, description: data.description, workflowStatus: data.workflowStatus || statuses[0]?.name || "", taskType: data.taskType || "TASK", parentTaskName: data.parentTaskName || "", assign_to: data.assign_to || "", dateDebut: data.dateDebut || null, dateEcheance: data.dateEcheance || null };
      if (selectedTask) {
        await api.put(`/v1/task/${selectedTask.id}`, payload);
        const currentPredecessors = dependencies.filter(d => d.successorId === selectedTask.id).map(d => d.predecessorId);
        for (let dep of dependencies.filter(d => d.successorId === selectedTask.id && !selectedPredecessors.includes(d.predecessorId))) {
          try { await api.delete(`/v1/tasks/dependencies/${dep.dependencyId}`); } catch(e) {}
        }
        for (let pId of selectedPredecessors.filter(pId => !currentPredecessors.includes(pId))) {
          try { await api.post(`/v1/tasks/dependencies`, { predecessorId: pId, successorId: selectedTask.id, projectId: project.id }); } catch(e) {}
        }
      } else {
        await api.post(`/v1/task/${project.id}`, payload);
      }
      setIsTaskModalOpen(false);
      fetchProjectData();
    } catch (err) {
      setTaskError(err.response?.data?.message || err.response?.data || "Erreur lors de l operation sur la tache.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTask) return;
    const formData = new FormData(); formData.append("file", file);
    try {
      setUploadingFile(true); setTaskError("");
      const res = await api.post(`/v1/task/${selectedTask.id}/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSelectedTask(res.data); fetchProjectData();
    } catch (err) { setTaskError(err.response?.data?.message || "Erreur lors du telechargement."); }
    finally { setUploadingFile(false); }
  };

  const handleFileDelete = async () => {
    if (!selectedTask || !selectedTask.attachmentUrl) return;
    try {
      setUploadingFile(true); setTaskError("");
      const res = await api.delete(`/v1/task/${selectedTask.id}/attachment`);
      setSelectedTask(res.data); fetchProjectData();
    } catch (err) { setTaskError(err.response?.data?.message || "Erreur suppression fichier."); }
    finally { setUploadingFile(false); }
  };

  const onAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    try {
      setMemberError(""); setLoadingMembers(true);
      await api.post(`/v1/project/${id}/members?projectRole=${newMemberRole}`, JSON.stringify(newMemberEmail), { headers: { "Content-Type": "application/json" } });
      setNewMemberEmail("");
      await fetchMembers();
    } catch (err) {
      setMemberError(err.response?.data?.message || err.response?.data || "Erreur lors de l ajout du membre.");
    } finally { setLoadingMembers(false); }
  };

  const onRemoveMember = async (email) => {
    try {
      setMemberError(""); setLoadingMembers(true);
      await api.delete(`/v1/project/${id}/members`, { data: email, headers: { "Content-Type": "application/json" } });
      await fetchMembers();
    } catch (err) { setMemberError(err.response?.data?.message || "Erreur suppression membre."); }
    finally { setLoadingMembers(false); }
  };

  const onDeleteTask = async (taskId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette tache ?")) return;
    try { await api.delete(`/v1/task/${taskId}`); fetchProjectData(); }
    catch (err) { alert(err.response?.data?.message || "Erreur lors de la suppression."); }
  };

  const onRenameStatus = async (statusId, newName, orderIndex, completed) => {
    try {
      await api.put(`/v1/projects/${id}/statuses/${statusId}`, { name: newName, orderIndex, completed });
      setStatuses(prev => prev.map(s => s.id === statusId ? { ...s, name: newName } : s));
      setTasks(prev => prev.map(t => t.workflowStatus === statuses.find(s => s.id === statusId)?.name ? { ...t, workflowStatus: newName } : t));
    } catch (err) { console.error("Erreur renommage statut", err); }
  };

  const onEditProjectSubmit = async (data) => {
    try {
      setProjectError("");
      const payload = { ...project, title: isOwner ? data.title : project.title, description: isOwner ? data.description : project.description, managerEmail: isAdmin ? data.managerEmail : project.managerEmail };
      await api.put(`/v1/project/${id}`, payload);
      setIsProjectModalOpen(false); fetchProjectData();
    } catch (err) { setProjectError(err.response?.data?.message || "Erreur modification projet."); }
  };

  const onDeleteProject = async () => {
    try { await api.delete(`/v1/project/${id}`); navigate("/projects"); }
    catch (err) { alert(err.response?.data?.message || "Erreur suppression projet."); }
  };

  const openProjectModal = () => {
    resetProject({ title: project.title, description: project.description, managerEmail: project.managerEmail });
    setIsProjectModalOpen(true);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text(`Projet : ${project.title}`, 14, 22);
    doc.setFontSize(12); doc.text(`Chef de projet : ${project.managerName || project.managerEmail}`, 14, 32);
    doc.text("Description :", 14, 42); doc.setFontSize(10);
    const splitDescription = doc.splitTextToSize(project.description || "", 180);
    doc.text(splitDescription, 14, 48);
    doc.autoTable({ startY: 48 + splitDescription.length * 5 + 10, head: [["Tache", "Statut", "Assigne a", "Echeance"]], body: tasks.map(t => [t.title, t.workflowStatus || "-", t.assign_to || "Non assigne", t.dateEcheance || "-"]), theme: "grid", headStyles: { fillColor: [37, 99, 235] } });
    doc.save(`${project.title.replace(/\s+/g, "_")}_rapport.pdf`);
  };

  useEffect(() => { fetchProjectData(); }, [id]);

  if (loading) return (<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>);
  if (error || !project) return (<div className="p-4 bg-red-50 text-red-600 rounded-lg text-center"><p>{error || "Projet introuvable"}</p><Link to="/projects" className="text-primary-600 underline mt-2 inline-block">Retour aux projets</Link></div>);

  const memberEmails = members.map(m => m.email).filter(Boolean);

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div>
        <Link to="/projects" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary-400 transition-colors mb-4 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Retour aux projets
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <Layers className="w-8 h-8 text-primary-400" />
              {project.title}
              {canEdit && (
                <div className="flex gap-1.5 ml-4 border-l pl-4 border-slate-800">
                  <button onClick={openProjectModal} className="text-slate-400 hover:text-primary-400 p-1.5 transition-colors" title="Modifier le projet"><Edit2 className="w-5 h-5" /></button>
                  {isOwner && <button onClick={() => setIsDeleteProjectModalOpen(true)} className="text-slate-400 hover:text-rose-400 p-1.5 transition-colors" title="Supprimer le projet"><Trash2 className="w-5 h-5" /></button>}
                </div>
              )}
            </h1>
            <p className="text-xs font-semibold text-primary-300 mt-2 bg-primary-500/10 border border-primary-500/20 px-3.5 py-1 rounded-full w-fit">Chef de projet : {project.managerName || project.managerEmail || "Inconnu"}</p>
            <p className="text-slate-400 mt-3 max-w-2xl text-sm leading-relaxed">{project.description}</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={exportToPDF} className="flex items-center gap-2 bg-[#121824]/60 border border-[#1f293d] hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-all text-sm font-semibold">Exporter PDF</button>
            <button onClick={openMembersModal} className="flex items-center gap-2 bg-[#121824]/60 border border-[#1f293d] hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-all text-sm font-semibold"><Users className="w-4 h-4" /> Membres</button>
            <button onClick={() => openTaskModal()} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl transition-all text-sm font-semibold"><Plus className="w-4 h-4" /> Nouvelle tache</button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-[#121824]/60 border border-[#1f293d] p-1 rounded-xl w-fit mt-3 mb-8 shadow-sm">
        <button onClick={() => setViewMode("kanban")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "kanban" ? "bg-primary-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}><AlignLeft className="w-4 h-4" /> Tableau Kanban</button>
        <button onClick={() => setViewMode("gantt")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "gantt" ? "bg-primary-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}><Network className="w-4 h-4" /> Gantt &amp; Dependances</button>
      </div>

      {viewMode === "gantt" ? (
        <GanttView tasks={tasks} dependencies={dependencies} projectId={id} onTaskClick={openTaskModal} refreshData={fetchProjectData} />
      ) : (
        <>
          {statuses.length === 0 ? (
            <div className="text-center py-16 glass-card border-dashed border-[#1f293d] rounded-2xl">
              <p className="text-slate-400 font-medium">Aucun statut de workflow trouve pour ce projet.</p>
              <p className="text-slate-500 text-sm mt-1">Les statuts sont crees automatiquement a la creation du projet.</p>
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4">
              {statuses.map((status, index) => {
                const color = getColorForIndex(index);
                const columnTasks = tasks.filter(t => t.workflowStatus === status.name);
                return (<KanbanColumn key={status.id} status={status} colorConfig={color} tasks={columnTasks} isOwner={isOwner} canEdit={canEdit} onTaskClick={openTaskModal} onDeleteTask={onDeleteTask} onRenameStatus={onRenameStatus} />);
              })}
            </div>
          )}
        </>
      )}

      {isMembersModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1f293d] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-[#1f293d] flex justify-between items-center bg-[#121824]/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-primary-400" /> Membres du projet</h2>
              <button onClick={() => setIsMembersModalOpen(false)} className="text-slate-400 hover:text-white text-xl">x</button>
            </div>
            <div className="p-6">
              {memberError && (<div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{memberError}</span></div>)}
              <form onSubmit={onAddMember} className="mb-6 space-y-3">
                <div className="flex gap-2">
                  <input type="email" required placeholder="Email du nouveau membre..." value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} className="flex-grow px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600" />
                  <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="px-3 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm">
                    {PROJECT_ROLES.map(role => (<option key={role} value={role}>{role.charAt(0) + role.slice(1).toLowerCase()}</option>))}
                  </select>
                </div>
                <button type="submit" disabled={loadingMembers || !newMemberEmail} className="w-full bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm font-semibold">
                  <UserPlus className="w-4 h-4" /> Ajouter le membre
                </button>
              </form>
              {loadingMembers && members.length === 0 ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
              ) : members.length === 0 ? (
                <p className="text-slate-500 text-center py-4 text-sm">Aucun membre trouve.</p>
              ) : (
                <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {members.map(member => (
                    <li key={member.id || member.email} className="flex items-center justify-between p-3 bg-[#121824]/40 rounded-xl border border-[#1f293d] group hover:border-slate-700 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-200 text-sm">{member.username || (member.email ? member.email.split("@")[0] : "Membre")}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${(member.projectRole || "") === "MANAGER" ? "bg-primary-500/15 text-primary-400 border-primary-500/25" : (member.projectRole || "") === "REVIEWER" ? "bg-amber-500/15 text-amber-400 border-amber-500/25" : (member.projectRole || "") === "VIEWER" ? "bg-slate-700 text-slate-400 border-slate-600" : "bg-cyan-500/15 text-cyan-400 border-cyan-500/25"}`}>
                          {member.projectRole || "CONTRIBUTOR"}
                        </span>
                        {(member.projectRole !== "MANAGER") && (
                          <button onClick={() => onRemoveMember(member.email)} disabled={loadingMembers} title="Retirer ce membre" className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1f293d] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-[#1f293d] flex justify-between items-center bg-[#121824]/50 shrink-0">
              <h2 className="text-lg font-bold text-white">{selectedTask ? "Modifier la Tache" : "Nouvelle Tache"}</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-white text-xl">x</button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleSubmit(onTaskSubmit)} className="p-6 space-y-4">
                {taskError && (<div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{taskError}</span></div>)}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Statut</label>
                  <select {...register("workflowStatus")} className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm">
                    {statuses.map(s => (<option key={s.id} value={s.name}>{s.name}</option>))}
                  </select>
                </div>
                {selectedTask && selectedTask.submissionDate && (
                  <div className="bg-[#121824]/40 p-3.5 rounded-xl border border-[#1f293d] text-xs space-y-1.5">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Informations de livraison</span>
                    <div className="flex justify-between items-center font-semibold text-slate-300">
                      <span>Date de remise :</span>
                      <span className={isSubmissionLate(selectedTask.submissionDate, selectedTask.dateEcheance) ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                        {formatDate(selectedTask.submissionDate)}
                        {isSubmissionLate(selectedTask.submissionDate, selectedTask.dateEcheance) && " (En retard)"}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Type de tache</label>
                  <select {...register("taskType")} className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm">
                    <option value="TASK">Task</option><option value="EPIC">Epic</option><option value="STORY">Story</option><option value="SUBTASK">Subtask</option>
                  </select>
                </div>
                {watch("taskType") !== "EPIC" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tache parente (optionnel)</label>
                    <select {...register("parentTaskName")} className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm">
                      <option value="">-- Aucune --</option>
                      {tasks.filter(t => (!selectedTask || t.id !== selectedTask.id)).map(t => (<option key={t.id} value={t.title}>{t.title} ({t.taskType || "TASK"})</option>))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Titre de la tache</label>
                  <input {...register("title")} className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.title ? "border-rose-500" : "border-[#1f293d]"}`} placeholder="Ex: Refonte du bouton de connexion" />
                  {errors.title && <p className="text-rose-400 text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea {...register("description")} rows={3} placeholder="Expliquez brievement la tache..." className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.description ? "border-rose-500" : "border-[#1f293d]"}`} />
                  {errors.description && <p className="text-rose-400 text-xs mt-1">{errors.description.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assigner a <span className="text-slate-500 font-normal">- Optionnel</span></label>
                  {memberEmails.length > 0 ? (
                    <select {...register("assign_to")} className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm">
                      <option value="">-- Non assigne --</option>
                      {memberEmails.map(email => (<option key={email} value={email}>{email}</option>))}
                    </select>
                  ) : (
                    <div className="text-xs text-slate-500 italic px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl">Aucun membre disponible - ajoutez d abord des membres au projet.</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5"><span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Date de debut</span></label>
                    <input type="date" {...register("dateDebut")} className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5"><span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Date d echeance</span></label>
                    <input type="date" {...register("dateEcheance")} className="w-full px-3.5 py-2 bg-[#121824] border border-[#1f293d] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm" />
                  </div>
                </div>
                {selectedTask && tasks.length > 1 && (
                  <div className="bg-[#121824]/40 p-4 rounded-xl border border-[#1f293d]">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2"><Network className="w-4 h-4 text-primary-400" /> Dependances (Taches Prealables)</label>
                    <p className="text-[11px] text-slate-500 mb-3">Selectionnez les taches qui doivent etre terminees avant celle-ci.</p>
                    <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                      {tasks.filter(t => t.id !== selectedTask.id).map(t => (
                        <label key={t.id} className="flex items-start gap-2.5 cursor-pointer group">
                          <input type="checkbox" className="mt-1 rounded border-slate-700 bg-slate-900 text-primary-600 focus:ring-primary-500" checked={selectedPredecessors.includes(t.id)}
                            onChange={(e) => { if (e.target.checked) { setSelectedPredecessors([...selectedPredecessors, t.id]); } else { setSelectedPredecessors(selectedPredecessors.filter(pid => pid !== t.id)); } }} />
                          <div>
                            <p className="text-sm font-semibold text-slate-300 group-hover:text-primary-400 transition-colors">{t.title}</p>
                            <p className="text-xs text-slate-500">{t.workflowStatus || "-"}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-3 border-t border-[#1f293d]/50">
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-slate-400 font-semibold hover:bg-slate-800/50 rounded-xl transition-colors text-sm">Annuler</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-sm shadow-md">
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {selectedTask ? "Mettre a jour" : "Creer la tache"}
                  </button>
                </div>
              </form>
              {selectedTask && (
                <div className="px-6 pb-4 pt-4 border-t border-[#1f293d]">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Paperclip className="w-4 h-4 text-primary-400" /> Piece jointe</h3>
                  {selectedTask.attachmentUrl ? (
                    <div className="flex items-center justify-between bg-[#121824]/40 p-3 rounded-xl border border-[#1f293d]">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-lg"><Paperclip className="w-5 h-5" /></div>
                        <span className="text-sm font-medium text-slate-300 truncate">{selectedTask.attachmentUrl.split("/").pop()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <a href={`http://localhost:9000/uploads/${selectedTask.attachmentUrl}`} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"><Download className="w-4 h-4" /></a>
                        <label className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer">{uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}<input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} /></label>
                        <button type="button" onClick={handleFileDelete} disabled={uploadingFile} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center border border-dashed border-[#1f293d] hover:border-slate-700 bg-[#121824]/20 hover:bg-[#121824]/40 rounded-xl p-6 transition-colors">
                      <label className="flex flex-col items-center gap-2 cursor-pointer w-full">
                        {uploadingFile ? <Loader2 className="w-6 h-6 animate-spin text-primary-500" /> : (<><div className="p-2.5 bg-primary-500/10 text-primary-400 rounded-xl"><Upload className="w-6 h-6" /></div><span className="text-xs font-semibold text-slate-300">Cliquez pour ajouter un fichier</span><span className="text-[10px] text-slate-500">PDF, Images, etc. (max 10MB)</span></>)}
                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                      </label>
                    </div>
                  )}
                </div>
              )}
              {selectedTask && (<div className="px-6 pb-6 pt-2 border-t border-[#1f293d]/50"><TaskComments taskId={selectedTask.id} /></div>)}
            </div>
          </div>
        </div>
      )}

      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1f293d] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-[#1f293d] flex justify-between items-center bg-[#121824]/50">
              <h2 className="text-lg font-bold text-white">Modifier le projet</h2>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-white text-xl">x</button>
            </div>
            <form onSubmit={handleSubmitProject(onEditProjectSubmit)} className="p-6 space-y-5">
              {projectError && (<div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{projectError}</span></div>)}
              {isOwner && (<><div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Titre du projet</label><input {...registerProject("title")} className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm ${projectErrors.title ? "border-rose-500" : "border-[#1f293d]"}`} />{projectErrors.title && <p className="text-rose-400 text-xs mt-1">{projectErrors.title.message}</p>}</div><div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label><textarea {...registerProject("description")} rows={4} className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm ${projectErrors.description ? "border-rose-500" : "border-[#1f293d]"}`} />{projectErrors.description && <p className="text-rose-400 text-xs mt-1">{projectErrors.description.message}</p>}</div></>)}
              {isAdmin && (<div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email du Chef de projet</label><input {...registerProject("managerEmail")} type="email" className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm ${projectErrors.managerEmail ? "border-rose-500" : "border-[#1f293d]"}`} />{projectErrors.managerEmail && <p className="text-rose-400 text-xs mt-1">{projectErrors.managerEmail.message}</p>}</div>)}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#1f293d]/50">
                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-slate-400 font-semibold hover:bg-slate-800/50 rounded-xl transition-colors text-sm">Annuler</button>
                <button type="submit" disabled={isProjectSubmitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-sm shadow-md">{isProjectSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-rose-500/30 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-rose-500/20 flex justify-between items-center bg-rose-950/20">
              <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Supprimer le projet</h2>
              <button onClick={() => setIsDeleteProjectModalOpen(false)} className="text-rose-400 hover:text-rose-300 text-xl">x</button>
            </div>
            <div className="p-6">
              <p className="text-slate-300 mb-6 text-sm leading-relaxed">Etes-vous sur de vouloir supprimer definitivement le projet <strong className="text-white">{project?.title}</strong> ? Cette action est irreversible.</p>
              <div className="flex justify-end gap-3 pt-3 border-t border-[#1f293d]/50">
                <button type="button" onClick={() => setIsDeleteProjectModalOpen(false)} className="px-4 py-2 text-slate-400 font-semibold hover:bg-slate-800/50 border border-[#1f293d] rounded-xl transition-colors text-sm">Annuler</button>
                <button type="button" onClick={onDeleteProject} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 text-sm"><Trash2 className="w-4 h-4" /> Supprimer definitivement</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
