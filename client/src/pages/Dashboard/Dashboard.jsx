import { useState, useEffect } from 'react';
import { Layers, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axiosConfig';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState({ projects: [], tasks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          api.get('/v1/project'),
          api.get('/v1/task')
        ]);
        setData({
          projects: projectsRes.data,
          tasks: tasksRes.data
        });
      } catch (error) {
        console.error("Erreur lors du chargement des données", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const inProgressTasksCount = data.tasks.filter(t => t.status === 'NOT_FINISH').length;
  const doneTasksCount = data.tasks.filter(t => t.status === 'END').length;
  const activeProjectsCount = data.projects.length;
  
  // Get up to 3 most recent projects
  const recentProjects = data.projects.slice(0, 3);

  // Filter tasks assigned to the current user and not END
  const myTasks = data.tasks.filter(t => (t.assign_to === user?.email || t.assign_to === user?.username) && t.status !== 'END').slice(0, 6);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 animate-fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Tableau de Bord</h1>
        <p className="text-slate-500 mt-2">Bienvenue, {user?.username} ! Voici un aperçu de vos activités.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-primary-100 text-primary-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Projets Actifs</p>
            <p className="text-2xl font-bold text-slate-800">{activeProjectsCount}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tâches en cours</p>
            <p className="text-2xl font-bold text-slate-800">{inProgressTasksCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tâches terminées</p>
            <p className="text-2xl font-bold text-slate-800">{doneTasksCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800">Mes Projets Récents</h2>
          {recentProjects.length > 0 && (
             <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
               Voir tout
             </Link>
          )}
        </div>
        
        {recentProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-50 mb-4">
              <Layers className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-slate-700 font-medium mb-1">Aucun projet</h3>
            <p className="text-slate-500 text-sm">Vous n'avez pas encore de projet. Commencez par en créer un !</p>
            <Link to="/projects" className="mt-6 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
              Créer un projet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentProjects.map(project => (
              <Link key={project.id} to={`/projects/${project.id}`} className="block border border-slate-100 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-primary-200">
                <h3 className="font-bold text-slate-800 mb-1 line-clamp-1">{project.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{project.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800">Mes Tâches à faire</h2>
        </div>
        
        {myTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-50 mb-4">
              <CheckCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-slate-700 font-medium mb-1">Aucune tâche assignée</h3>
            <p className="text-slate-500 text-sm">Vous n'avez pas de tâches en cours. C'est le moment de se détendre !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTasks.map(task => (
              <div key={task.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-sm">{task.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${task.status === 'TO_DO' ? 'bg-slate-200 text-slate-600' : 'bg-blue-200 text-blue-800'}`}>
                    {task.status === 'TO_DO' ? 'À FAIRE' : 'EN COURS'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{task.description}</p>
                <div className="mt-auto">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-primary-600 bg-primary-50 px-2 py-1 rounded-md">
                    <Layers className="w-3 h-3" />
                    Projet: {task.projectName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
