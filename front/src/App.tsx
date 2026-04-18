import { Component, useState, useEffect } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Sparkles, Home } from "lucide-react";
import { StarterPage } from "@/pages/StarterPage";
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

type Page = "starter" | "reference" | "showcase";

function readPageFromHash(): Page {
  const h = window.location.hash;
  if (h === "#reference") return "reference";
  if (h === "#showcase") return "showcase";
  return "starter";
}

function Nav({ current, onChange }: { current: Page; onChange: (p: Page) => void }) {
  const items: ReadonlyArray<{ id: Page; label: string; icon: ReactNode; activeColor: string }> = [
    { id: "starter", label: "Start", icon: <Home className="w-3.5 h-3.5" />, activeColor: "bg-[#009de0]" },
    { id: "reference", label: "Reference", icon: <Sparkles className="w-3.5 h-3.5" />, activeColor: "bg-[#009de0]" },
    { id: "showcase", label: "Components", icon: <LayoutGrid className="w-3.5 h-3.5" />, activeColor: "bg-purple-600" },
  ];
  return (
    <div className="fixed top-3 right-4 z-50 flex gap-1 bg-card border border-border rounded-xl p-1 shadow-sm">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            current === item.id
              ? `${item.activeColor} text-white`
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { i18n } = useTranslation();
  const [page, setPage] = useState<Page>(readPageFromHash);
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  // Auto-route away from the Starter once the consultant has dismissed it
  useEffect(() => {
    fetch("/agent-apps/scaffold-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        const isDismissed = !!s?.dismissed;
        setDismissed(isDismissed);
        if (isDismissed && page === "starter") setPage("reference");
      })
      .catch(() => setDismissed(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    const hash = page === "starter" ? "" : `#${page}`;
    if (window.location.hash !== hash) window.location.hash = hash;
  }, [page]);

  // Wait for the dismissed check before rendering, to avoid a flash of Starter
  if (dismissed === null) return null;

  return (
    <AppErrorBoundary>
      <Nav current={page} onChange={setPage} />
      {page === "starter" && <StarterPage />}
      {page === "reference" && <ReferencePage />}
      {page === "showcase" && <ShowcasePage />}
    </AppErrorBoundary>
  );
}
