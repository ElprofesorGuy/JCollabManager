import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import api from '../api/axiosConfig';

const normalizeDate = (dateVal) => {
  if (!dateVal) {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }
  
  if (Array.isArray(dateVal)) {
    if (dateVal.length >= 3) {
      return new Date(dateVal[0], dateVal[1] - 1, dateVal[2]);
    }
  }
  
  if (typeof dateVal === 'string') {
    const parts = dateVal.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
  }
  
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const generatePath = (fromX, fromY, toX, toY) => {
  const gap = 12; // Espace horizontal minimal avant de tourner
  
  // Si le successeur commence après le prédécesseur + gap
  if (toX >= fromX + gap * 2) {
    const midX = fromX + gap;
    return `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
  } else {
    // Si c'est un retour en arrière ou chevauchement, on fait un contournement
    const midY = (fromY + toY) / 2;
    return `M ${fromX} ${fromY} L ${fromX + gap} ${fromY} L ${fromX + gap} ${midY} L ${toX - gap} ${midY} L ${toX - gap} ${toY} L ${toX} ${toY}`;
  }
};

const sortTasksTopologically = (tasks, dependencies) => {
  if (!tasks || tasks.length === 0) return [];
  
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const adj = {};
  const inDegree = {};
  
  tasks.forEach(t => {
    adj[t.id] = [];
    inDegree[t.id] = 0;
  });
  
  if (dependencies && dependencies.length > 0) {
    dependencies.forEach(dep => {
      if (taskMap.has(dep.predecessorId) && taskMap.has(dep.successorId)) {
        adj[dep.predecessorId].push(dep.successorId);
        inDegree[dep.successorId] += 1;
      }
    });
  }
  
  const compareTasks = (a, b) => {
    const dateDebutA = normalizeDate(a.dateDebut);
    const dateDebutB = normalizeDate(b.dateDebut);
    if (dateDebutA < dateDebutB) return -1;
    if (dateDebutA > dateDebutB) return 1;
    const dateEchA = normalizeDate(a.dateEcheance);
    const dateEchB = normalizeDate(b.dateEcheance);
    if (dateEchA < dateEchB) return -1;
    if (dateEchA > dateEchB) return 1;
    return (a.title || '').localeCompare(b.title || '');
  };
  
  const result = [];
  const readyQueue = tasks.filter(t => inDegree[t.id] === 0);
  readyQueue.sort(compareTasks);
  
  while (readyQueue.length > 0) {
    const u = readyQueue.shift();
    result.push(u);
    
    const successors = adj[u.id] || [];
    successors.forEach(vId => {
      inDegree[vId] -= 1;
      if (inDegree[vId] === 0) {
        const v = taskMap.get(vId);
        if (v) {
          readyQueue.push(v);
        }
      }
    });
    readyQueue.sort(compareTasks);
  }
  
  if (result.length < tasks.length) {
    const visitedSet = new Set(result.map(t => t.id));
    tasks.forEach(t => {
      if (!visitedSet.has(t.id)) {
        result.push(t);
      }
    });
  }
  
  return result;
};

const GanttView = ({ tasks, dependencies, projectId, onTaskClick, refreshData }) => {
  const [dependencyLines, setDependencyLines] = useState([]);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const containerRef = useRef(null);

  const sortedTasks = useMemo(() => {
    return sortTasksTopologically(tasks, dependencies);
  }, [tasks, dependencies]);

  useEffect(() => {
    const calculateCoordinates = () => {
      if (!sortedTasks || sortedTasks.length === 0 || !dependencies || dependencies.length === 0) {
        setDependencyLines([]);
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const lines = [];

      dependencies.forEach(dep => {
        const predEl = document.getElementById(`task-bar-${dep.predecessorId}`);
        const succEl = document.getElementById(`task-bar-${dep.successorId}`);

        if (predEl && succEl) {
          const predRect = predEl.getBoundingClientRect();
          const succRect = succEl.getBoundingClientRect();

          // Fin de la barre du prédécesseur (milieu droit)
          const fromX = predRect.right - containerRect.left;
          const fromY = predRect.top - containerRect.top + (predRect.height / 2);

          // Début de la barre du successeur (milieu gauche)
          const toX = succRect.left - containerRect.left;
          const toY = succRect.top - containerRect.top + (succRect.height / 2);

          lines.push({
            id: dep.dependencyId,
            predecessorId: dep.predecessorId,
            successorId: dep.successorId,
            fromX,
            fromY,
            toX,
            toY
          });
        }
      });

      setDependencyLines(lines);
    };

    // Calculer immédiatement
    calculateCoordinates();
    
    // Timer de secours pour être sûr que le layout est finalisé
    const timer = setTimeout(calculateCoordinates, 150);

    window.addEventListener('resize', calculateCoordinates);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateCoordinates);
    };
  }, [sortedTasks, dependencies]);
  // Calcul de la plage de dates du projet
  const dateRange = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      const today = normalizeDate();
      return { min: today, max: today, days: 1 };
    }
    
    let minDate = new Date('2099-01-01');
    let maxDate = new Date('1970-01-01');
    
    tasks.forEach(task => {
      let start = normalizeDate(task.dateDebut);
      let end = normalizeDate(task.dateEcheance);
      
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    });

    // Ajouter une marge de 5 jours avant et après
    minDate.setDate(minDate.getDate() - 5);
    maxDate.setDate(maxDate.getDate() + 5);
    
    // S'assurer qu'il y a au moins 14 jours
    const diffTime = Math.abs(maxDate - minDate);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 14) {
      maxDate.setDate(minDate.getDate() + 14);
    }
    
    return { min: minDate, max: maxDate, days: Math.round(Math.abs(maxDate - minDate) / (1000 * 60 * 60 * 24)) };
  }, [tasks]);

  const daysArray = Array.from({ length: dateRange.days }, (_, i) => {
    const d = new Date(dateRange.min);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getTaskStyle = (task) => {
    let start = normalizeDate(task.dateDebut);
    let end = normalizeDate(task.dateEcheance);
    
    if (start > end) end = start; // Fallback

    const startOffset = Math.max(0, Math.round((start - dateRange.min) / (1000 * 60 * 60 * 24)));
    const duration = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
    
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
        <div ref={containerRef} className="min-w-max p-6">
          {/* Timeline Header */}
          <div className="relative flex items-center p-1 mb-4 sticky top-0 bg-white z-20 border-b border-slate-100 py-2">
            {/* Espaceur identique au titre des tâches */}
            <div className="sticky left-6 z-20 max-w-[200px] w-[200px] mr-4 bg-white/90 backdrop-blur-sm px-2 py-1 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)] rounded-r-md text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">
              Tâches
            </div>
            
            {/* Grille des Jours */}
            <div 
              className="grid gap-1 w-full" 
              style={{ gridTemplateColumns: `repeat(${dateRange.days}, 40px)` }}
            >
              {daysArray.map((date, idx) => {
                const isToday = date.toDateString() === normalizeDate().toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <div key={idx} className={`flex flex-col items-center justify-center text-xs h-10 ${isToday ? 'bg-primary-50 text-primary-700 font-bold rounded-t-md' : isWeekend ? 'text-slate-400 bg-slate-50 rounded-t-md' : 'text-slate-600'}`}>
                    <span>{date.getDate()}</span>
                    <span className="opacity-70 text-[10px]">{date.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ligne "Aujourd'hui" */}
          {daysArray.findIndex(d => d.toDateString() === normalizeDate().toDateString()) !== -1 && (
            <div 
              className="absolute top-0 bottom-0 border-l-2 border-primary-400/50 border-dashed z-0 pointer-events-none"
              style={{ left: `${(daysArray.findIndex(d => d.toDateString() === normalizeDate().toDateString()) * 40) + 264}px` }} // 24=padding, 4=row padding, 200=label, 16=margin, 20=half cell
            >
              <div className="absolute top-2 -left-8 bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Aujourd'hui</div>
            </div>
          )}

          {/* Tasks Rows */}
          <div className="space-y-4 relative z-10">
            {sortedTasks.map((task) => {
              const style = getTaskStyle(task);
              const colorClass = getStatusColor(task.status);
              
              // Détecter si la tâche a des dates invalides (missing debut or echeance)
              const isMissingDates = !task.dateDebut || !task.dateEcheance;

              return (
                <div 
                  key={task.id} 
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                  className="relative flex items-center hover:bg-slate-550 rounded-lg p-1 transition-colors group"
                >
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
                      id={`task-bar-${task.id}`}
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

          {/* Overlay des flèches de dépendances */}
          <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full" style={{ minWidth: `${dateRange.days * 40 + 264}px` }}>
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#94a3b8" />
              </marker>
              <marker
                id="arrow-hover"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#3b82f6" />
              </marker>
            </defs>
            {dependencyLines.map((line) => {
              const isHighlighted = hoveredTaskId === line.predecessorId || hoveredTaskId === line.successorId;
              return (
                <path
                  key={line.id}
                  d={generatePath(line.fromX, line.fromY, line.toX, line.toY)}
                  fill="none"
                  stroke={isHighlighted ? '#3b82f6' : '#94a3b8'}
                  strokeWidth={isHighlighted ? 2 : 1.2}
                  strokeDasharray={isHighlighted ? 'none' : '4 2'}
                  markerEnd={isHighlighted ? 'url(#arrow-hover)' : 'url(#arrow)'}
                  className="transition-colors duration-150"
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default GanttView;
