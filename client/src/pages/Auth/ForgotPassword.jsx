import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const schema = z.object({
  email: z.string().email({ message: 'Adresse e-mail invalide' }),
});

const ForgotPassword = () => {
  const [serverMessage, setServerMessage] = useState('');
  const [serverError, setServerError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      setServerError('');
      setServerMessage('');
      // Le backend attend { userEmail: '...' } via le ForgotPasswordDTO
      const response = await api.post('/auth/forgot-password', { userEmail: data.email });
      
      if (response.data && response.data.message) {
        setServerMessage(response.data.message);
      } else {
        setServerMessage('Si ce compte existe, un lien de récupération a été envoyé par e-mail.');
      }
    } catch (error) {
      setServerError("Une erreur est survenue lors de l'envoi de la demande.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 glass-card overflow-hidden">
      <div className="px-8 pt-8 pb-6 bg-[#121824]/40 border-b border-[#1f293d] text-center relative">
        <Link to="/login" className="absolute left-4 top-8 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h2 className="text-2xl font-extrabold text-white mb-2 mt-2 tracking-wide">Mot de passe oublié</h2>
        <p className="text-slate-400 text-sm">Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
        {serverError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-2 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}
        
        {serverMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-start gap-2 text-xs">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{serverMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Adresse e-mail</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              {...register('email')}
              className={`w-full pl-11 pr-3.5 py-2.5 bg-[#121824] border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-200 text-sm placeholder-slate-600 transition-all ${errors.email ? 'border-rose-500' : 'border-[#1f293d]'}`}
              placeholder="votre@email.com"
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || serverMessage !== ''}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2.5 px-4 rounded-xl border border-primary-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all disabled:opacity-75 disabled:cursor-not-allowed text-sm mt-2"
        >
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
