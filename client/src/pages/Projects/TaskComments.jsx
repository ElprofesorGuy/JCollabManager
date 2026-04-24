import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Loader2, User } from 'lucide-react';
import api from '../../api/axiosConfig';
import useAuthStore from '../../store/useAuthStore';

const TaskComments = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/v1/tasks/${taskId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error("Erreur lors du chargement des commentaires", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchComments();
    }
  }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await api.post(`/v1/tasks/${taskId}/comments`, { text: newComment });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error("Erreur lors de l'ajout du commentaire", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    try {
      await api.delete(`/v1/tasks/${taskId}/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      console.error("Erreur lors de la suppression du commentaire", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Commentaires ({comments.length})
      </h3>

      <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
        {comments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-2">Aucun commentaire pour le moment.</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 group">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{comment.authorName}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                {(user?.role === 'ADMIN' || user?.username === comment.authorName || user?.email === comment.authorName) && (
                  <button 
                    onClick={() => handleDelete(comment.id)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap ml-7">{comment.text}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className="flex-grow px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          disabled={submitting}
        />
        <button 
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};

export default TaskComments;
