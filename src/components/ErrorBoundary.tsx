import React, { Component, ErrorInfo, ReactNode } from 'react';
import { safeStorage } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CDD Gacha 2 ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    safeStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-900 border-2 border-red-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-950/80 border border-red-700 flex items-center justify-center text-red-400 text-2xl font-black">
              ⚔
            </div>
            <h2 className="text-2xl font-serif font-black text-amber-200">
              Perturbación en la Puerta Astral
            </h2>
            <p className="text-xs text-stone-300 leading-relaxed">
              La energía de Icespear ha sufrido una inestabilidad mágica temporal.
            </p>
            {this.state.error && (
              <div className="bg-black/80 border border-stone-800 rounded-lg p-3 text-left overflow-x-auto text-[11px] font-mono text-red-300">
                {this.state.error.message}
              </div>
            )}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-sm cursor-pointer shadow-lg transition-all"
              >
                Reintentar Carga
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs cursor-pointer transition-all"
              >
                Reiniciar Guardado Local
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
