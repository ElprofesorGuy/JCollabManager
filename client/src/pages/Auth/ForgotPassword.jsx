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
    <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-8 pt-8 pb-6 bg-primary-600 text-white text-center relative">
        <Link to="/login" className="absolute left-4 top-8 text-white/80 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h2 className="text-2xl font-bold mb-2 mt-2">Mot de passe oublié</h2>
        <p className="text-primary-100 text-sm">Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-8">
        {serverError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded flex items-start gap-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}
        
        {serverMessage && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded flex items-start gap-2 text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{serverMessage}</span>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-slate-700 text-sm font-medium mb-1">Adresse e-mail</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              {...register('email')}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'}`}
              placeholder="votre@email.com"
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || serverMessage !== ''}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-lg shadow transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
