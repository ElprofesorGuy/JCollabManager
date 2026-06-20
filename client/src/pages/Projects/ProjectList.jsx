import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api/axiosConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const projectSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères"),
  description: z.string().min(10, "La description doit faire au moins 10 caractères"),
  ownerEmail: z.string().email("L'adresse email est invalide"),
});

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' ou 'mine'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(projectSchema)
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'mine' ? '/v1/project/my-projects' : '/v1/project';
      const res = await api.get(endpoint);
      setProjects(res.data);
    } catch (err) {
      setError('Impossible de charger les projets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeTab]);

  const onSubmit = async (data) => {
    try {
      setSubmitError('');
      await api.post('/v1/project', data);
      setIsModalOpen(false);
      reset();
      fetchProjects();
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || err.response?.data || "Erreur lors de la création du projet.");
    }
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">Projets</h1>
          <p className="text-slate-400 mt-1.5 text-sm">Gerez vos projets et collaborez avec votre équipe.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] font-semibold text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Projet</span>
        </button>
      </div>

      {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">{error}</div>}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex bg-[#121824]/60 border border-[#1f293d] p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'all' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Tous les projets
          </button>
          <button 
            onClick={() => setActiveTab('mine')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'mine' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Mes projets
          </button>
        </div>
        <div className="bg-[#121824]/60 px-4 py-2.5 rounded-xl border border-[#1f293d] flex items-center gap-3 flex-grow focus-within:border-primary-500/40 transition-colors">
          <Search className="w-5 h-5 text-slate-500" />
          <input 
            type="text"
            placeholder="Rechercher un projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full focus:outline-none text-slate-200 bg-transparent text-sm placeholder-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <Link key={project.id} to={`/projects/${project.id}`} className="block group">
            <div className="glass-card glass-card-hover p-6 h-full flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center mb-5 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">{project.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-3 mb-5 flex-grow leading-relaxed">{project.description}</p>
              <div className="mt-auto pt-4 border-t border-[#1f293d]/50 flex justify-between items-center text-xs text-slate-500 font-semibold">
                <span>Chef : {project.ownerName || (project.ownerEmail ? project.ownerEmail.split('@')[0] : 'Inconnu')}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredProjects.length === 0 && !loading && (
        <div className="text-center py-16 glass-card border-dashed border-[#1f293d] rounded-2xl">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Aucun projet trouvé.</p>
        </div>
      )}

      {/* Modal Création */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1f293d] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-[#1f293d] flex justify-between items-center bg-[#121824]/50">
              <h2 className="text-lg font-bold text-white">Nouveau Projet</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {submitError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Titre</label>
                <input 
                  {...register('title')} 
                  placeholder="Nom du projet"
                  className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.title ? 'border-rose-500' : 'border-[#1f293d]'}`}
                />
                {errors.title && <p className="text-rose-400 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea 
                  {...register('description')} 
                  rows={4}
                  placeholder="Description du projet et de ses objectifs..."
                  className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.description ? 'border-rose-500' : 'border-[#1f293d]'}`}
                />
                {errors.description && <p className="text-rose-400 text-xs mt-1">{errors.description.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email du Propriétaire</label>
                <input 
                  type="email"
                  {...register('ownerEmail')} 
                  className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.ownerEmail ? 'border-rose-500' : 'border-[#1f293d]'}`}
                  placeholder="ex: chef.projet@email.com"
                />
                {errors.ownerEmail && <p className="text-rose-400 text-xs mt-1">{errors.ownerEmail.message}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-[#1f293d]/50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 font-semibold hover:bg-slate-800/50 rounded-xl transition-colors text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
