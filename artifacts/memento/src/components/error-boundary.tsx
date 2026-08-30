import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  resetKey?: any;
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
    console.error("Uncaught error:", error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full p-8 border border-destructive/20 bg-destructive/5 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="font-serif text-3xl text-primary mb-4">Something went wrong</h2>
            <p className="text-sm text-primary/70 mb-8 font-light">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <Button 
              variant="outline" 
              className="border-primary uppercase tracking-widest text-xs rounded-none"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
