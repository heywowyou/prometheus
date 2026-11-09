import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Changing this value remounts the boundary, clearing a caught error. */
  resetKey?: string;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time errors so one broken subapp doesn't blank the whole shell.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive opacity-70" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Something went wrong on this page.
          </p>
          <p className="max-w-md text-xs text-muted-foreground">{error.message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={this.reset}>
          Try again
        </Button>
      </div>
    );
  }
}

export default ErrorBoundary;
