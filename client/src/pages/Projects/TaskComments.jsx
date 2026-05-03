import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Loader2, User, Edit2, X, Check } from 'lucide-react';
import api from '../../api/axiosConfig';
import useAuthStore from '../../store/useAuthStore';

const TaskComments = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editingSubmit, setEditingSubmit] = useState(false);
  
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

  const handleEditInit = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleEditSubmit = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      setEditingSubmit(true);
      await api.put(`/v1/tasks/${taskId}/comments/${commentId}`, { text: editCommentText });
      setEditingCommentId(null);
      setEditCommentText('');
      fetchComments();
    } catch (err) {
      console.error("Erreur lors de la modification du commentaire", err);
    } finally {
      setEditingSubmit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-6 bg-slate-50/50 rounded-xl mt-6 border border-slate-100">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <div className="p-1.5 bg-primary-100 text-primary-600 rounded-lg">
            <MessageSquare className="w-4 h-4" />
          </div>
          Discussion ({comments.length})
        </h3>
      </div>

      <div className="p-5">
        <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          {comments.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">Aucun commentaire pour le moment.</p>
              <p className="text-xs text-slate-400 mt-1">Soyez le premier à participer à la discussion.</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="group relative">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border border-primary-100">
                      {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm hover:shadow-md transition-shadow relative">
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-800">{comment.authorName}</span>
                          <span className="text-[11px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                            {new Date(comment.createdAt).toLocaleDateString()} à {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        
                        {(user?.role === 'ADMIN' || user?.username === comment.authorName || user?.email === comment.authorName) && editingCommentId !== comment.id && (
                          <div className="flex items-center gap-1 opacity-100 transition-opacity bg-white px-1 py-1 rounded-lg border border-slate-100 shadow-sm">
                            <button 
                              onClick={() => handleEditInit(comment)}
                              className="p-1 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-px h-3 bg-slate-200 mx-0.5"></div>
                            <button 
                              onClick={() => handleDelete(comment.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {editingCommentId === comment.id ? (
                        <div className="mt-2 relative animate-in fade-in slide-in-from-top-1">
                          <textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="w-full px-3 py-2 text-sm text-slate-700 bg-white border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[80px] resize-y"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={handleEditCancel}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1.5"
                              disabled={editingSubmit}
                            >
                              <X className="w-3.5 h-3.5" />
                              Annuler
                            </button>
                            <button
                              onClick={() => handleEditSubmit(comment.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-70"
                              disabled={editingSubmit || !editCommentText.trim() || editCommentText === comment.text}
                            >
                              {editingSubmit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              Enregistrer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {comment.text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="relative mt-4">
          <div className="relative flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-50 transition-all">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Écrivez votre commentaire..."
              className="flex-grow bg-transparent px-3 py-2 max-h-32 min-h-[44px] resize-y focus:outline-none text-sm text-slate-700 placeholder:text-slate-400"
              disabled={submitting}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button 
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="h-[44px] px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 hover:shadow-md disabled:opacity-50 disabled:hover:shadow-none transition-all flex-shrink-0 flex items-center justify-center font-medium shadow-sm gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">Envoyer</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 ml-2 font-medium">Astuce : Appuyez sur Entrée pour envoyer, Maj+Entrée pour passer à la ligne.</p>
        </form>
      </div>
    </div>
  );
};

export default TaskComments;

