'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log structured error (without stack trace in production)
    const isDev = process.env.NODE_ENV === 'development';
    console.error('[NexLab ErrorBoundary]', {
      message: error.message,
      name: error.name,
      ...(isDev && { stack: error.stack, componentStack: errorInfo.componentStack }),
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Une erreur inattendue s&apos;est produite
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Un problème technique est survenu. Vos données n&apos;ont pas été perdues.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-zinc-400 cursor-pointer">Détails techniques</summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Accueil
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
