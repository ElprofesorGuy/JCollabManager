import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e17] via-[#0f172a] to-[#020617] p-6">
          <div className="max-w-lg w-full glass-card p-8 text-center">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-2">Oops, une erreur est survenue</h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Un problème inattendu a empêché l'affichage de cette page.
              Essayez de recharger la page ou retournez à l'accueil.
            </p>
            {this.state.error && (
              <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-left">
                <p className="text-rose-400 text-xs font-mono break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-[#1f293d] text-slate-200 rounded-xl text-sm font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
              <a
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              >
                <Home className="w-4 h-4" />
                Tableau de bord
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
