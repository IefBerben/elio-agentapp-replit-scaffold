import { Component, useState, useEffect } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Sparkles } from "lucide-react";
import { ReferencePage } from "@/pages/_ReferencePage";
import { ShowcasePage } from "@/pages/ShowcasePage";

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

// ─── Nav ─────────────────────────────────────────────────────────────────────

type Page = "demo" | "showcase";

function Nav({ current, onChange }: { current: Page; onChange: (p: Page) => void }) {
  return (
    <div className="fixed top-3 right-4 z-50 flex gap-1 bg-card border border-border rounded-xl p-1 shadow-sm">
      <button
        onClick={() => onChange("demo")}
        title="Demo agent"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          current === "demo"
            ? "bg-[#009de0] text-white"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Demo
      </button>
      <button
        onClick={() => onChange("showcase")}
        title="Design system showcase"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          current === "showcase"
            ? "bg-purple-600 text-white"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Showcase
      </button>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { i18n } = useTranslation();

  const [page, setPage] = useState<Page>(() =>
    window.location.hash === "#showcase" ? "showcase" : "demo"
  );

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    window.location.hash = page === "showcase" ? "showcase" : "";
  }, [page]);

  return (
    <AppErrorBoundary>
      <Nav current={page} onChange={setPage} />
      {page === "demo" ? <ReferencePage /> : <ShowcasePage />}
    </AppErrorBoundary>
  );
}
