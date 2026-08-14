import { useState, useEffect } from 'react';
import { Layers, CheckCircle, Clock, Loader2, ListTodo, AlertTriangle, Users, Calendar, TrendingUp, BarChart3, ShieldAlert, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axiosConfig';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const parseTaskDate = (dateField) => {
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

const formatDate = (dateField) => {
  if (!dateField) return '—';
  try {
    if (Array.isArray(dateField)) {
      const [y, m, d] = dateField;
      return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
    }
    const str = String(dateField);
    // Handle full ISO datetime like "2026-07-21T10:30:00.000Z"
    const dateOnly = str.split('T')[0];
    const parts = dateOnly.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return str;
  } catch (e) {
    return '—';
  }
};

const getStandardStatus = (task) => {
  if (task.dateEcheance) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = parseTaskDate(task.dateEcheance);
    if (due && due < today && !/termin|done|end/i.test(task.workflowStatus || "")) {
      return "EN RETARD";
    }
  }
  return task.workflowStatus || "Non defini";
};

const isOverdue = (dateEcheance, isCompleted) => {
  if (!dateEcheance || isCompleted) return false;
  const due = parseTaskDate(dateEcheance);
  if (!due) return false;
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return today > due;
};

const COLUMN_COLORS = ['#64748b', '#06b6d4', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];


const getDynamicStats = (tasksList) => {
  const stats = {};
  
  tasksList.forEach(t => {
    const std = getStandardStatus(t);
    if (!stats[std]) {
      const colorIndex = Object.keys(stats).length % COLUMN_COLORS.length;
      stats[std] = { name: std, value: 0, color: COLUMN_COLORS[colorIndex] };
    }
    stats[std].value += 1;
  });
  
  return Object.values(stats).sort((a, b) => b.value - a.value);
};

const getDeadlineBadge = (parsedDate) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const taskDate = new Date(parsedDate);
  taskDate.setHours(0,0,0,0);
  
  const diffTime = taskDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">En Retard</span>;
  } else if (diffDays === 0) {
    return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">Aujourd'hui</span>;
  } else if (diffDays === 1) {
    return <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">Demain</span>;
  } else if (diffDays > 1) {
    return <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">Dans {diffDays} jours</span>;
  }
  return <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">À Venir</span>;
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState({ projects: [], tasks: [] });
  const [loading, setLoading] = useState(true);
  const [dashboardTab, setDashboardTab] = useState('personal'); // 'personal', 'team', or 'admin'
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [notStartedTasks, setNotStartedTasks] = useState([]);
  const [endedTasks, setEndedTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const projectsUrl = user?.role === 'ADMIN' ? '/v1/project' : '/v1/project/my-projects';
        const [projectsRes, tasksRes] = await Promise.all([
          api.get(projectsUrl),
          api.get('/v1/task?pageSize=1000') // Charge toutes les tâches pour des statistiques complètes
        ]);
        setData({
          projects: projectsRes.data,
          tasks: tasksRes.data.content || tasksRes.data
        });
        
        if (user?.role === 'ADMIN') {
          setLoadingUsers(true);
          const [usersRes, inProgressRes, notStartedRes, endedRes, overdueRes] = await Promise.all([
            api.get('/v1/user'),
            api.get('/v1/task/unachievedtask'),
            api.get('/v1/task/unstartedtask'),
            api.get('/v1/task/endedtask'),
            api.get('/v1/task/overduetask'),
          ]);
          setUsersList(usersRes.data || []);
          setInProgressTasks(inProgressRes.data || []);
          setNotStartedTasks(notStartedRes.data || []);
          setEndedTasks(endedRes.data || []);
          setOverdueTasks(overdueRes.data || []);
          setLoadingUsers(false);
        } else {
          // If normal user, fetch ONLY their specific assigned tasks counts via specific endpoints
          const [inProgressRes, notStartedRes, endedRes, overdueRes] = await Promise.all([
            api.get(`/v1/task/${user.id}/myUnachievedTasks`),
            api.get(`/v1/task/${user.id}/myUnstartedTasks`),
            api.get(`/v1/task/${user.id}/myEndedTasks`),
            api.get(`/v1/task/${user.id}/myOverdueTasks`),
          ]);
          setInProgressTasks(inProgressRes.data || []);
          setNotStartedTasks(notStartedRes.data || []);
          setEndedTasks(endedRes.data || []);
          setOverdueTasks(overdueRes.data || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  const handleDeleteUser = async (userId) => {
    if (userId === user?.id) {
      alert("Vous ne pouvez pas supprimer votre propre compte !");
      return;
    }
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible et supprimera ses affectations de tâches.")) return;
    try {
      await api.delete(`/v1/user/${userId}`);
      setUsersList(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert("Erreur lors de la suppression de l'utilisateur : " + (err.response?.data?.message || err.message));
    }
  };

  // Global counts — Admin uses precise dedicated endpoints, Team/User tabs might still rely on filtered scope
  const isAdmin = user?.role === 'ADMIN';
  const activeProjectsCount = data.projects.length;
  const overdueTasksCount = isAdmin ? overdueTasks.length : data.tasks.filter(t => isOverdue(t.dateEcheance, t.isCompleted) && !t.submissionDate).length;
  const completedTasksCount = isAdmin ? endedTasks.length : data.tasks.filter(t => t.isCompleted).length;
  const inProgressCount = isAdmin ? inProgressTasks.length : data.tasks.filter(t => !t.isCompleted && !isOverdue(t.dateEcheance, t.isCompleted)).length;
  const notStartedCount = isAdmin ? notStartedTasks.length : data.tasks.filter(t => !t.isCompleted).length;

  const taskStatsData = getDynamicStats(data.tasks);

  // Current user's tasks — scoped to assigned tasks
  const allMyTasks = data.tasks.filter(t => t.assignTo === user?.email || t.assignTo === user?.username);
  const myTotalCount = allMyTasks.length;
  const myTaskStatsData = getDynamicStats(allMyTasks);
  
  // Real values for personal dashboard from new endpoints (for both admin and normal users)
  const myOverdueCount = isAdmin 
    ? overdueTasks.filter(t => t.assignTo === user?.email || t.assignTo === user?.username).length
    : overdueTasks.length;
  const myCompletedCount = isAdmin
    ? endedTasks.filter(t => t.assignTo === user?.email || t.assignTo === user?.username).length
    : endedTasks.length;
  const myInProgressCount = isAdmin
    ? inProgressTasks.filter(t => t.assignTo === user?.email || t.assignTo === user?.username).length
    : inProgressTasks.length;
  const myNotStartedCount = isAdmin
    ? notStartedTasks.filter(t => t.assignTo === user?.email || t.assignTo === user?.username).length
    : allMyTasks.filter(t => !t.isCompleted).length;
  
  // Get up to 3 most recent projects
  const recentProjects = data.projects.slice(0, 3);

  // Filter tasks assigned to the current user and not completed (heuristically filtered)
  const myTasks = allMyTasks.filter(t => !t.isCompleted).slice(0, 6);

  // Urgent tasks across all projects based on user's business logic (Point 6)
  const urgentTasks = data.tasks
    .filter(t => !t.isCompleted && t.dateEcheance)
    .map(t => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const due = parseTaskDate(t.dateEcheance);
      due.setHours(0,0,0,0);
      const start = parseTaskDate(t.dateDebut) || new Date(due.getTime() - 24*60*60*1000);
      start.setHours(0,0,0,0);

      const remainingDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

      return {
        ...t,
        parsedDate: due,
        isValidUrgent: remainingDays >= 0 && remainingDays < 3
      };
    })
    .filter(t => t.isValidUrgent)
    .sort((a, b) => a.parsedDate - b.parsedDate)
    .slice(0, 5);



  // Projects completions percentage
  const projectsProgress = data.projects.map(project => {
    const projectTasks = data.tasks.filter(t => t.projectName === project.title);
    const total = projectTasks.length;
    const completed = projectTasks.filter(t => t.isCompleted).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      ...project,
      totalTasks: total,
      completedTasks: completed,
      percentage: percent
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // Workload of Team (Chart Data)
  const workloadData = (() => {
    const userMap = {};
    const allStatuses = [...new Set(data.tasks.map(t => t.workflowStatus || "Non defini"))];
    
    data.tasks.forEach(t => {
      if (!t.assignTo) return;
      const name = t.assignTo.split('@')[0];
      if (!userMap[name]) {
        userMap[name] = { name };
        allStatuses.forEach(s => userMap[name][s] = 0);
        userMap[name]['total'] = 0;
      }
      const statusName = t.workflowStatus || "Non defini";
      userMap[name][statusName] += 1;
      userMap[name]['total'] += 1;
    });
    return Object.values(userMap).sort((a, b) => b.total - a.total).slice(0, 6);
  })();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">Tableau de Bord</h1>
          <p className="text-slate-400 mt-1.5 text-sm">Bienvenue, <span className="text-primary-400 font-semibold">{user?.username}</span> ! Voici un aperçu de vos activités.</p>
        </div>
        
        {/* Switcher Onglets */}
        <div className="flex bg-[#121824]/60 border border-[#1f293d] p-1 rounded-xl w-fit shadow-sm self-start md:self-auto">
          <button 
            onClick={() => setDashboardTab('personal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${dashboardTab === 'personal' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Mon Espace</span>
          </button>
          <button 
            onClick={() => setDashboardTab('team')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${dashboardTab === 'team' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Users className="w-4 h-4" />
            <span>Espace Équipe</span>
          </button>
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setDashboardTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${dashboardTab === 'admin' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Console Admin</span>
            </button>
          )}
        </div>
      </header>

      {/* VUE PERSONNELLE */}
      {dashboardTab === 'personal' && (
        <div className="space-y-8">
          {/* Cartes KPI Personnel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Non commencées */}
            <Link to="/tasks/not-started" className="glass-card glass-card-hover p-5 flex items-center gap-4 border-l-4 border-l-slate-500 group cursor-pointer">
              <div className="p-3 bg-slate-500/10 text-slate-400 rounded-xl group-hover:bg-slate-500/20 transition-colors">
                <ListTodo className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Non commencées</p>
                <p className="text-2xl font-bold text-white mt-0.5">{myNotStartedCount}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>

            {/* En cours */}
            <Link to="/tasks/in-progress" className="glass-card glass-card-hover p-5 flex items-center gap-4 border-l-4 border-l-cyan-500 group cursor-pointer">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En cours</p>
                <p className="text-2xl font-bold text-white mt-0.5">{myInProgressCount}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>

            {/* Terminées */}
            <Link to="/tasks/completed" className="glass-card glass-card-hover p-5 flex items-center gap-4 border-l-4 border-l-emerald-500 group cursor-pointer">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Terminées</p>
                <p className="text-2xl font-bold text-white mt-0.5">{myCompletedCount}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>

            {/* En retard */}
            <Link to="/tasks/overdue" className="glass-card glass-card-hover p-5 flex items-center gap-4 border-l-4 border-l-rose-500 group cursor-pointer">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl group-hover:bg-rose-500/20 transition-colors">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En retard</p>
                <p className="text-2xl font-bold text-white mt-0.5">{myOverdueCount}</p>
              </div>
              {myOverdueCount > 0 && (
                <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              )}
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>

          </div>

          {/* Grille Principale Personnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Mes Tâches actives */}
            <div className="lg:col-span-2 glass-card p-6 flex flex-col h-[480px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-primary-400" />
                  Mes tâches actives
                </h2>
              </div>
              
              {myTasks.length === 0 ? (
                <div className="flex-grow flex flex-col justify-center items-center py-12 text-center">
                  <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-900/50 mb-4 border border-[#1f293d]">
                    <CheckCircle className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-slate-300 font-medium mb-1">Aucune tâche active</h3>
                  <p className="text-slate-500 text-sm">Vous n'avez pas de tâche en cours d'exécution.</p>
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myTasks.map(task => (
                      <div key={task.id} className={`border rounded-xl p-5 flex flex-col justify-between transition-all ${
                        task.status === 'OVERDUE' 
                          ? 'border-rose-500/20 bg-rose-500/5 hover:border-rose-500/35' 
                          : 'border-[#1f293d] bg-[#121824]/40 hover:border-slate-700'
                      }`}>
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-slate-200 text-sm leading-snug truncate pr-2" title={task.title}>{task.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                              getStandardStatus(task) === 'EN RETARD' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}>
                              {getStandardStatus(task)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">{task.description}</p>
                        </div>
                        <div className="pt-2 border-t border-[#1f293d]/50 flex justify-between items-center text-[10px]">
                          <span className="font-bold text-primary-400 bg-primary-500/10 px-2.5 py-0.5 rounded-md truncate max-w-[60%]">
                            {task.projectName}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1 font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            {task.dateEcheance ? formatDate(task.dateEcheance) : 'Pas d\'échéance'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Répartition personnelle */}
            <div className="glass-card p-6 flex flex-col justify-between h-[480px]">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Mes Statistiques</h2>
                <p className="text-xs text-slate-500">Répartition de votre charge de travail.</p>
              </div>
              
              {allMyTasks.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-slate-500 text-sm">Aucune tâche assignée.</div>
              ) : (
                <div className="h-64 w-full flex-grow mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={myTaskStatsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {myTaskStatsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} tâche(s)`, '']}
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderRadius: '12px', 
                          border: '1px solid #1e293b', 
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                          color: '#f8fafc' 
                        }}
                        itemStyle={{ color: '#f8fafc' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Mes Projets Récents */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Mes Projets Récents
              </h2>
              {recentProjects.length > 0 && (
                 <Link to="/projects" className="text-xs text-primary-400 hover:text-primary-300 font-semibold uppercase tracking-wider transition-colors">
                   Voir tout
                 </Link>
              )}
            </div>
            
            {recentProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-900/50 mb-4 border border-[#1f293d]">
                  <Layers className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-slate-300 font-medium mb-1">Aucun projet</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">Vous n'avez pas encore de projet. Commencez par en créer un !</p>
                {user?.role === 'ADMIN' && (
                  <Link to="/projects" className="mt-6 inline-block px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors font-semibold text-sm shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                    Créer un projet
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentProjects.map(project => (
                  <Link key={project.id} to={`/projects/${project.id}`} className="block bg-[#121824]/40 border border-[#1f293d] hover:border-primary-500/40 rounded-xl p-5 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5 transition-all">
                    <h3 className="font-bold text-slate-200 mb-1.5 line-clamp-1 hover:text-white">{project.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{project.description}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VUE ÉQUIPE / GLOBALE */}
      {dashboardTab === 'team' && (
        <div className="space-y-8">
          {/* Cartes KPI Globales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Non commencées */}
            <Link to="/tasks/not-started" className="glass-card glass-card-hover p-5 flex items-center gap-4 border-l-4 border-l-slate-500 group cursor-pointer">
              <div className="p-3 bg-slate-500/10 text-slate-400 rounded-xl group-hover:bg-slate-500/20 transition-colors">
                <ListTodo className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Non commencées</p>
                <p className="text-2xl font-bold text-white mt-0.5">{notStartedCount}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>

            {/* En cours */}
            <Link to="/tasks/in-progress" className="glass-card glass-card-hover p-5 flex items-center gap-4 border-l-4 border-l-cyan-500 group cursor-pointer">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En cours</p>
                <p className="text-2xl font-bold text-white mt-0.5">{inProgressCount}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>

            {/* Terminées */}
            <Link to="/tasks/completed" className="glass-card glass-card-hover p-5 flex items-center gap-4 border-l-4 border-l-emerald-500 group cursor-pointer">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Terminées</p>
                <p className="text-2xl font-bold text-white mt-0.5">{completedTasksCount}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>

            {/* En retard */}
            <Link to="/tasks/overdue" className="glass-card glass-card-hover p-5 flex items-center gap-4 border-l-4 border-l-rose-500 group cursor-pointer">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl group-hover:bg-rose-500/20 transition-colors">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En retard</p>
                <p className="text-2xl font-bold text-white mt-0.5">{overdueTasksCount}</p>
              </div>
              {overdueTasksCount > 0 && (
                <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              )}
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>

          </div>

          {/* Deux colonnes d'analyses */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Colonne Gauche : Projets et workload */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Progression des Projets */}
              <div className="glass-card p-6 flex flex-col h-[320px]">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    Progression des projets
                  </h2>
                  <p className="text-xs text-slate-500">Taux de complétion des tâches de chaque projet.</p>
                </div>
                
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-4">
                  {projectsProgress.length === 0 ? (
                    <p className="text-slate-500 text-sm py-4">Aucun projet actif pour afficher la progression.</p>
                  ) : (
                    projectsProgress.map(p => (
                      <div key={p.id} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <Link to={`/projects/${p.id}`} className="text-slate-200 hover:text-primary-400 transition-colors truncate max-w-[70%]">
                            {p.title}
                          </Link>
                          <span className="text-slate-400">
                            {p.completedTasks}/{p.totalTasks} tâches ({p.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              p.percentage === 100 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                                : p.percentage >= 50 
                                ? 'bg-gradient-to-r from-primary-500 to-indigo-400' 
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{ width: `${p.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Charge de travail de l'équipe */}
              <div className="glass-card p-6 flex flex-col h-[380px]">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    Répartition par équipier
                  </h2>
                  <p className="text-xs text-slate-500">Nombre de tâches actives assignées par membre de l'équipe.</p>
                </div>
                
                {workloadData.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center text-slate-500 text-sm">
                    Aucune tâche assignée dans l'application.
                  </div>
                ) : (
                  <div className="flex-grow h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={workloadData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderRadius: '12px', 
                            border: '1px solid #1e293b', 
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                            color: '#f8fafc' 
                          }}
                          itemStyle={{ fontSize: '11px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        {(() => {
                          const uniqueStatuses = [...new Set(data.tasks.map(t => t.workflowStatus || "Non defini"))];
                          return uniqueStatuses.map((status, index) => {
                            const isLast = index === uniqueStatuses.length - 1;
                            return (
                              <Bar key={status} dataKey={status} stackId="a" fill={COLUMN_COLORS[index % COLUMN_COLORS.length]} radius={isLast ? [4, 4, 0, 0] : [0, 0, 0, 0]} maxBarSize={30} />
                            );
                          });
                        })()}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

            </div>

            {/* Colonne Droite : Échéances urgentes et répartition globale */}
            <div className="space-y-8">
              
              {/* Échéances Imminentes */}
              <div className="glass-card p-6 flex flex-col h-[320px]">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    Échéances urgentes
                  </h2>
                  <p className="text-xs text-slate-500">Prochaines tâches prioritaires à livrer.</p>
                </div>
                
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 space-y-3">
                  {urgentTasks.length === 0 ? (
                    <p className="text-slate-500 text-sm py-4">Aucune échéance à venir.</p>
                  ) : (
                    urgentTasks.map(task => (
                      <div key={task.id} className="flex justify-between items-center p-3 bg-[#121824]/40 rounded-xl border border-[#1f293d] hover:border-slate-700 transition-colors">
                        <div className="overflow-hidden pr-2">
                          <h4 className="font-bold text-slate-200 text-xs truncate" title={task.title}>{task.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                            <span className="truncate max-w-[100px] text-primary-400 font-semibold">{task.projectName}</span>
                            <span>•</span>
                            <span className="truncate font-medium">{task.assignTo ? task.assignTo.split('@')[0] : 'Non assigné'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-1">
                          <span className="text-[10px] font-bold text-slate-300">{formatDate(task.dateEcheance)}</span>
                          {getDeadlineBadge(task.parsedDate)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Répartition Globale (Pie Chart) */}
              <div className="glass-card p-6 flex flex-col justify-between h-[380px]">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Répartition des tâches</h2>
                  <p className="text-xs text-slate-500">Statut de l'ensemble des tâches de l'équipe.</p>
                </div>
                
                {data.tasks.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center text-slate-500 text-sm">Aucune tâche disponible.</div>
                ) : (
                  <div className="h-64 w-full flex-grow mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskStatsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {taskStatsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`${value} tâche(s)`, '']}
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderRadius: '12px', 
                            border: '1px solid #1e293b', 
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                            color: '#f8fafc' 
                          }}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}
      {dashboardTab === 'admin' && user?.role === 'ADMIN' && (
        <div className="space-y-8 animate-fade-in">
          {/* Cartes KPI Admin */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-primary-500">
              <div className="p-3 bg-primary-500/10 text-primary-400 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Projets</p>
                <p className="text-2xl font-bold text-white mt-1">{activeProjectsCount}</p>
              </div>
            </div>

            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-cyan-500">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
                <ListTodo className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tâches</p>
                <p className="text-2xl font-bold text-white mt-1">{data.tasks.length}</p>
              </div>
            </div>

            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-emerald-500">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Utilisateurs Enregistrés</p>
                <p className="text-2xl font-bold text-white mt-1">{usersList.length}</p>
              </div>
            </div>

            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-purple-500">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Taux de Complétion</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {data.tasks.length > 0 ? Math.round((data.tasks.filter(t => t.isCompleted).length / data.tasks.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Table d'administration des utilisateurs */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Gestion des Utilisateurs</h2>
                <p className="text-xs text-slate-500">Liste complète de tous les comptes enregistrés dans l'application.</p>
              </div>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
            ) : usersList.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Aucun utilisateur trouvé.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1f293d] text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Utilisateur</th>
                      <th className="py-3.5 px-4">Adresse Email</th>
                      <th className="py-3.5 px-4">Rôle Système</th>
                      <th className="py-3.5 px-4">Date d'inscription</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f293d]/50 text-slate-300 text-sm">
                    {usersList.map(u => (
                      <tr key={u.id} className="hover:bg-[#121824]/20 transition-colors">
                        <td className="py-4 px-4 font-semibold text-white">{u.username}</td>
                        <td className="py-4 px-4">{u.email}</td>
                        <td className="py-4 px-4">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            u.role === 'ADMIN' 
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/25' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {u.role === 'ADMIN' ? 'Administrateur' : 'Membre'}
                          </span>
                        </td>
                        <td className="py-4 px-4">{formatDate(u.date_creation || u.dateCreation)}</td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user?.id}
                            className={`p-2 rounded-lg transition-all ${
                              u.id === user?.id 
                                ? 'text-slate-600 cursor-not-allowed opacity-40' 
                                : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                            }`}
                            title={u.id === user?.id ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer cet utilisateur"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
