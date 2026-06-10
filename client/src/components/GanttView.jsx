import React, { useMemo } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import api from '../api/axiosConfig';

const GanttView = ({ tasks, dependencies, projectId, onTaskClick, refreshData }) => {
  // Calcul de la plage de dates du projet
  const dateRange = useMemo(() => {
    if (!tasks || tasks.length === 0) return { min: new Date(), max: new Date(), days: 1 };
    
    let minDate = new Date('2099-01-01');
    let maxDate = new Date('1970-01-01');
    
    tasks.forEach(task => {
      let start = task.dateDebut ? new Date(Array.isArray(task.dateDebut) ? task.dateDebut.join('-') : task.dateDebut) : new Date();
      let end = task.dateEcheance ? new Date(Array.isArray(task.dateEcheance) ? task.dateEcheance.join('-') : task.dateEcheance) : new Date();
      
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    });

    // Ajouter une marge de 5 jours avant et après
    minDate.setDate(minDate.getDate() - 5);
    maxDate.setDate(maxDate.getDate() + 5);
    
    // S'assurer qu'il y a au moins 14 jours
    const diffTime = Math.abs(maxDate - minDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 14) {
      maxDate.setDate(minDate.getDate() + 14);
    }
    
    return { min: minDate, max: maxDate, days: Math.ceil(Math.abs(maxDate - minDate) / (1000 * 60 * 60 * 24)) };
  }, [tasks]);

  const daysArray = Array.from({ length: dateRange.days }, (_, i) => {
    const d = new Date(dateRange.min);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getTaskStyle = (task) => {
    let start = task.dateDebut ? new Date(Array.isArray(task.dateDebut) ? task.dateDebut.join('-') : task.dateDebut) : new Date();
    let end = task.dateEcheance ? new Date(Array.isArray(task.dateEcheance) ? task.dateEcheance.join('-') : task.dateEcheance) : new Date();
    
    if (start > end) end = start; // Fallback

    const startOffset = Math.max(0, Math.ceil((start - dateRange.min) / (1000 * 60 * 60 * 24)));
    const duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    
    return {
      gridColumnStart: startOffset + 1,
      gridColumnEnd: startOffset + 1 + duration,
    };
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'TO_DO': return 'bg-slate-300 border-slate-400 text-slate-800';
      case 'NOT_FINISH': return 'bg-gradient-to-r from-blue-400 to-blue-500 border-blue-600 text-white shadow-blue-200 shadow-md';
      case 'END': return 'bg-gradient-to-r from-emerald-400 to-emerald-500 border-emerald-600 text-white shadow-emerald-200 shadow-md opacity-80';
      case 'OVERDUE': return 'bg-gradient-to-r from-red-400 to-red-500 border-red-600 text-white shadow-red-200 shadow-md animate-pulse';
      default: return 'bg-primary-500 border-primary-600 text-white';
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center">
        <Calendar className="w-16 h-16 text-slate-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-700">Aucune tâche à afficher</h3>
        <p className="text-slate-500 mt-2">Créez des tâches avec des dates de début et d'échéance pour visualiser le diagramme de Gantt.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative group/gantt">
      {/* Container scrollable */}
      <div className="overflow-x-auto custom-scrollbar pb-6 relative">
        <div className="min-w-max p-6">
          {/* Timeline Header */}
          <div 
            className="grid gap-1 mb-4 sticky top-0 bg-white z-10 py-2 border-b border-slate-100" 
            style={{ gridTemplateColumns: `repeat(${dateRange.days}, 40px)` }}
          >
            {daysArray.map((date, idx) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              return (
                <div key={idx} className={`flex flex-col items-center justify-center text-xs ${isToday ? 'bg-primary-50 text-primary-700 font-bold rounded-t-md' : isWeekend ? 'text-slate-400 bg-slate-50 rounded-t-md' : 'text-slate-600'}`}>
                  <span>{date.getDate()}</span>
                  <span className="opacity-70 text-[10px]">{date.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                </div>
              );
            })}
          </div>

          {/* Ligne "Aujourd'hui" */}
          {daysArray.findIndex(d => d.toDateString() === new Date().toDateString()) !== -1 && (
            <div 
              className="absolute top-0 bottom-0 border-l-2 border-primary-400/50 border-dashed z-0 pointer-events-none"
              style={{ left: `${(daysArray.findIndex(d => d.toDateString() === new Date().toDateString()) * 40) + 24 + 20}px` }} // 24=padding, 20=half cell
            >
              <div className="absolute top-2 -left-8 bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Aujourd'hui</div>
            </div>
          )}

          {/* Tasks Rows */}
          <div className="space-y-4 relative z-10">
            {tasks.map((task) => {
              const style = getTaskStyle(task);
              const colorClass = getStatusColor(task.status);
              
              // Détecter si la tâche a des dates invalides (missing debut or echeance)
              const isMissingDates = !task.dateDebut || !task.dateEcheance;

              return (
                <div key={task.id} className="relative flex items-center hover:bg-slate-50 rounded-lg p-1 transition-colors group">
                  {/* Label gauche flottant (collant) */}
                  <div className="sticky left-6 z-20 max-w-[200px] w-[200px] bg-white/90 backdrop-blur-sm px-2 py-1 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)] rounded-r-md truncate text-sm font-semibold text-slate-700 mr-4 flex items-center gap-2">
                    {isMissingDates && <AlertCircle className="w-3.5 h-3.5 text-orange-400" title="Dates manquantes, affichage par défaut" />}
                    {task.title}
                  </div>
                  
                  {/* Grille Gantt */}
                  <div 
                    className="grid gap-1 w-full relative" 
                    style={{ gridTemplateColumns: `repeat(${dateRange.days}, 40px)` }}
                  >
                    {/* Background grid lines */}
                    <div className="col-start-1 col-end-[-1] flex border-b border-slate-50/50 h-full absolute inset-0 z-0">
                       {daysArray.map((_, i) => <div key={i} className="w-[40px] border-r border-slate-100/50 h-full"></div>)}
                    </div>

                    {/* Task Bar */}
                    <div 
                      onClick={() => onTaskClick(task)}
                      className={`relative z-10 h-8 rounded-md border text-xs flex items-center px-2 cursor-pointer transition-transform hover:-translate-y-0.5 ${colorClass}`}
                      style={{ 
                        gridColumnStart: style.gridColumnStart, 
                        gridColumnEnd: style.gridColumnEnd 
                      }}
                      title={`${task.title} (${task.status})`}
                    >
                      <span className="truncate w-full drop-shadow-sm font-medium">{task.title}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overlay des flèches de dépendances (Simplifié : on pourrait utiliser SVG) */}
          <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full" style={{ minWidth: `${dateRange.days * 40 + 48}px` }}>
            {/* Logique avancée de dessin de flèches SVG à implémenter si les coordonnées Y étaient fixes, 
                pour l'instant le Gantt s'affiche très bien sous forme de roadmap. */}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default GanttView;
