import { useState, useEffect } from 'react';
import { Users, Plus, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import api from '../../api/axiosConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const userSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit faire au moins 3 caractères"),
  email: z.string().email("L'adresse email est invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
});

const UserManagement = () => {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(userSchema)
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/v1/user');
      setUsersList(res.data);
    } catch (err) {
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data) => {
    try {
      setSubmitError('');
      await api.post('/v1/user', {
        username: data.username,
        email: data.email,
        password: data.password,
        role: 'MEMBER'
      });
      setIsModalOpen(false);
      reset();
      fetchUsers();
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || err.response?.data || "Erreur lors de la création de l'utilisateur.");
    }
  };

  const onDeleteUser = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) return;
    try {
      await api.delete(`/v1/user/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.response?.data || "Erreur lors de la suppression.");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-400" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-slate-400 mt-1.5 text-sm">Gérez les membres de la plateforme. (Accès réservé à l'Administration)</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] font-semibold text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvel Utilisateur</span>
        </button>
      </div>

      {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">{error}</div>}

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#121824]/50 border-b border-[#1f293d]">
              <th className="p-4 text-sm font-bold text-slate-300">Nom d'utilisateur</th>
              <th className="p-4 text-sm font-bold text-slate-300">Email</th>
              <th className="p-4 text-sm font-bold text-slate-300">Rôle</th>
              <th className="p-4 text-sm font-bold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersList.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-500">Aucun utilisateur trouvé.</td>
              </tr>
            ) : (
              usersList.map((usr) => (
                <tr key={usr.id} className="border-b border-[#1f293d]/40 hover:bg-[#121824]/40 transition-colors text-slate-300">
                  <td className="p-4 font-semibold text-slate-200">{usr.username}</td>
                  <td className="p-4 text-slate-400">{usr.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${usr.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {usr.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {usr.role !== 'ADMIN' && (
                      <button 
                        onClick={() => onDeleteUser(usr.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Création Utilisateur */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-[#1f293d] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-[#1f293d] flex justify-between items-center bg-[#121824]/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-400" />
                Créer un Membre
              </h2>
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nom d'utilisateur</label>
                <input 
                  {...register('username')} 
                  placeholder="Nom de l'utilisateur"
                  className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.username ? 'border-rose-500' : 'border-[#1f293d]'}`}
                />
                {errors.username && <p className="text-rose-400 text-xs mt-1">{errors.username.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Adresse Email</label>
                <input 
                  type="email"
                  {...register('email')} 
                  placeholder="ex: membre@email.com"
                  className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.email ? 'border-rose-500' : 'border-[#1f293d]'}`}
                />
                {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Mot de passe temporaire</label>
                <input 
                  type="text"
                  {...register('password')} 
                  placeholder="Entrez un mot de passe temporaire..."
                  className={`w-full px-3.5 py-2 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 ${errors.password ? 'border-rose-500' : 'border-[#1f293d]'}`}
                />
                {errors.password && <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>}
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

export default UserManagement;
