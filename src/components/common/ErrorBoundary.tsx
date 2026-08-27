import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    try {
      window.history.pushState({}, '', '/');
      window.location.reload();
    } catch {
      window.location.href = '/';
    }
  };

  private handleResetStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Terjadi Kendala pada Tampilan
              </h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Aplikasi mendeteksi error pada script browser. Data lokal Anda aman. Anda dapat mencoba memuat ulang halaman atau membersihkan cache.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
                <p className="text-[11px] font-mono text-rose-400 font-semibold break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang Halaman
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Kembali ke Beranda
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={this.handleResetStorage}
                className="text-[11px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
              >
                Reset Cache & Data Sesi Lokal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
