import { useState, useEffect } from 'react';
import { Layers, CheckCircle, Clock, Loader2, ListTodo, AlertTriangle, Users, Calendar, TrendingUp, BarChart3, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axiosConfig';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState({ projects: [], tasks: [] });
  const [loading, setLoading] = useState(true);
  const [dashboardTab, setDashboardTab] = useState('personal'); // 'personal' ou 'team'

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          api.get('/v1/project'),
          api.get('/v1/task?pageSize=1000') // Charge toutes les tâches pour des statistiques complètes
        ]);
        setData({
          projects: projectsRes.data,
          tasks: tasksRes.data.content || tasksRes.data
        });
      } catch (error) {
        console.error("Erreur lors du chargement des données", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Global counts
  const inProgressTasksCount = data.tasks.filter(t => t.status === 'NOT_FINISH').length;
  const doneTasksCount = data.tasks.filter(t => t.status === 'END').length;
  const activeProjectsCount = data.projects.length;
  const todoTasksCount = data.tasks.filter(t => t.status === 'TO_DO').length;
  const overdueTasksCount = data.tasks.filter(t => t.status === 'OVERDUE').length;

  const taskStatsData = [
    { name: 'À FAIRE', value: todoTasksCount, color: '#64748b' },
    { name: 'EN COURS', value: inProgressTasksCount, color: '#06b6d4' },
    { name: 'TERMINÉES', value: doneTasksCount, color: '#10b981' },
    { name: 'EN RETARD', value: overdueTasksCount, color: '#f43f5e' }
  ].filter(item => item.value > 0);

  // Current user's specific tasks and counts
  const allMyTasks = data.tasks.filter(t => (t.assign_to === user?.email || t.assign_to === user?.username));
  const myTodoCount = allMyTasks.filter(t => t.status === 'TO_DO').length;
  const myInProgressCount = allMyTasks.filter(t => t.status === 'NOT_FINISH').length;
  const myDoneCount = allMyTasks.filter(t => t.status === 'END').length;
  const myOverdueCount = allMyTasks.filter(t => t.status === 'OVERDUE').length;
  const myTotalCount = allMyTasks.length;

  const myTaskStatsData = [
    { name: 'À FAIRE', value: myTodoCount, color: '#64748b' },
    { name: 'EN COURS', value: myInProgressCount, color: '#06b6d4' },
    { name: 'TERMINÉES', value: myDoneCount, color: '#10b981' },
    { name: 'EN RETARD', value: myOverdueCount, color: '#f43f5e' }
  ].filter(item => item.value > 0);
  
  // Get up to 3 most recent projects
  const recentProjects = data.projects.slice(0, 3);

  // Filter tasks assigned to the current user and not END
  const myTasks = allMyTasks.filter(t => t.status !== 'END').slice(0, 6);

  // Helpers for dates
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
    if (!dateField) return null;
    if (Array.isArray(dateField)) {
      const [y, m, d] = dateField;
      return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
    }
    const parts = String(dateField).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateField;
  };

  // Urgent tasks across all projects
  const urgentTasks = data.tasks
    .filter(t => t.status !== 'END' && t.dateEcheance)
    .map(t => ({
      ...t,
      parsedDate: parseTaskDate(t.dateEcheance)
    }))
    .filter(t => t.parsedDate !== null)
    .sort((a, b) => a.parsedDate - b.parsedDate)
    .slice(0, 5);

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
    } else if (diffDays <= 7) {
      return <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">Sous 7j</span>;
    }
    return <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">À Venir</span>;
  };

  // Projects completions percentage
  const projectsProgress = data.projects.map(project => {
    const projectTasks = data.tasks.filter(t => t.projectName === project.title);
    const total = projectTasks.length;
    const completed = projectTasks.filter(t => t.status === 'END').length;
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
    data.tasks.forEach(t => {
      if (!t.assign_to) return;
      const name = t.assign_to.split('@')[0];
      if (!userMap[name]) {
        userMap[name] = { name, 'À FAIRE': 0, 'EN COURS': 0, 'EN RETARD': 0 };
      }
      if (t.status === 'TO_DO') userMap[name]['À FAIRE'] += 1;
      else if (t.status === 'NOT_FINISH') userMap[name]['EN COURS'] += 1;
      else if (t.status === 'OVERDUE') userMap[name]['EN RETARD'] += 1;
    });
    return Object.values(userMap).sort((a, b) => 
      (b['À FAIRE'] + b['EN COURS'] + b['EN RETARD']) - (a['À FAIRE'] + a['EN COURS'] + a['EN RETARD'])
    ).slice(0, 6); // Affiche les 6 utilisateurs les plus actifs
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
        </div>
      </header>

      {/* VUE PERSONNELLE */}
      {dashboardTab === 'personal' && (
        <div className="space-y-8">
          {/* Cartes KPI Personnel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-primary-500">
              <div className="p-3 bg-primary-500/10 text-primary-400 rounded-xl">
                <ListTodo className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mes Tâches</p>
                <p className="text-2xl font-bold text-white mt-1">{myTotalCount}</p>
              </div>
            </div>

            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-slate-400">
              <div className="p-3 bg-slate-500/10 text-slate-400 rounded-xl">
                <ListTodo className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">À faire</p>
                <p className="text-2xl font-bold text-white mt-1">{myTodoCount}</p>
              </div>
            </div>

            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-cyan-500">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En cours</p>
                <p className="text-2xl font-bold text-white mt-1">{myInProgressCount}</p>
              </div>
            </div>

            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-emerald-500">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Terminées</p>
                <p className="text-2xl font-bold text-white mt-1">{myDoneCount}</p>
              </div>
            </div>

            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-rose-500">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En retard</p>
                <p className="text-2xl font-bold text-rose-400 mt-1">{myOverdueCount}</p>
              </div>
            </div>
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
                              task.status === 'OVERDUE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              task.status === 'TO_DO' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                              'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}>
                              {task.status === 'OVERDUE' ? 'EN RETARD' : task.status === 'TO_DO' ? 'À FAIRE' : 'EN COURS'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-indigo-500">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projets Actifs</p>
                <p className="text-2xl font-bold text-white mt-1">{activeProjectsCount}</p>
              </div>
            </div>

            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-slate-400">
              <div className="p-3 bg-slate-500/10 text-slate-400 rounded-xl">
                <ListTodo className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tâches à faire</p>
                <p className="text-2xl font-bold text-white mt-1">{todoTasksCount}</p>
              </div>
            </div>
            
            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-cyan-500">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tâches en cours</p>
                <p className="text-2xl font-bold text-white mt-1">{inProgressTasksCount}</p>
              </div>
            </div>

            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-emerald-500">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tâches terminées</p>
                <p className="text-2xl font-bold text-white mt-1">{doneTasksCount}</p>
              </div>
            </div>

            <div className="glass-card glass-card-hover p-6 flex items-center gap-4 border-l-4 border-l-rose-500">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tâches en retard</p>
                <p className="text-2xl font-bold text-rose-400 mt-1">{overdueTasksCount}</p>
              </div>
            </div>
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
                        <Bar dataKey="À FAIRE" stackId="a" fill="#64748b" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="EN COURS" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="EN RETARD" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
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
                            <span className="truncate font-medium">{task.assign_to ? task.assign_to.split('@')[0] : 'Non assigné'}</span>
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
    </div>
  );
};

export default Dashboard;
