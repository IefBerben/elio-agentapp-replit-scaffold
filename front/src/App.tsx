import { Component, useEffect } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ReferencePage } from "@/pages/_ReferencePage";

// ─── Error Boundary ──────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-lg w-full">
            <h1 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { i18n } = useTranslation();

  // Sync html lang attribute with current language
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <AppErrorBoundary>
      <ReferencePage />
    </AppErrorBoundary>
  );
}
