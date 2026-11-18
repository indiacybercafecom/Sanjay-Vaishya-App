import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AppRouter } from './app/AppRouter';

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  declare state: ErrorBoundaryState;
  declare readonly props: { children: React.ReactNode };

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-[#0B0D11] text-[#F4F6F9] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#13161D] border border-[#262B38] rounded-lg p-6 space-y-4">
            <p className="font-mono text-xs text-[#ED1C24]">RUNTIME RECOVERY</p>
            <h1 className="text-xl font-bold text-white">Unexpected Interface Error</h1>
            <p className="text-sm text-[#CCCCCC]">
              A view crashed unexpectedly. Reload the application cleanly to continue.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] px-5 py-2 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold"
            >
              Reload Platform
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </AppErrorBoundary>
  );
}
