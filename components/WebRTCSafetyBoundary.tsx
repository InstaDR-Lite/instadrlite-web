import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode; // 👈 Explicitly type children here
  fallbackFallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class WebRTCSafetyBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MediaDance UI Guard] Caught background pipeline error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallbackFallback || (
        <div className="flex items-center justify-center h-full w-full bg-zinc-950 text-zinc-400 p-4 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium">Reconnecting video stream...</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-xs text-emerald-400 hover:underline"
            >
              Force Refresh Feed
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}