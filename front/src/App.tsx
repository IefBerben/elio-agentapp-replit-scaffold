import { Component, useState, useEffect } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Home } from "lucide-react";
import { StarterPage } from "@/pages/StarterPage";
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

// ─── Top app bar (scaffold chrome — sits above each page's header) ───────────

type Page = "starter" | "showcase";

function readPageFromHash(): Page {
  const h = window.location.hash;
  if (h === "#showcase") return "showcase";
  return "starter";
}

function ScaffoldTopBar({
  current,
  onChange,
  showStarter,
}: {
  current: Page;
  onChange: (p: Page) => void;
  showStarter: boolean;
}) {
  const allItems: ReadonlyArray<{
    id: Page;
    label: string;
    icon: ReactNode;
    activeColor: string;
  }> = [
    {
      id: "starter",
      label: "Start",
      icon: <Home className="w-3.5 h-3.5" />,
      activeColor: "bg-[#009de0] text-white",
    },
    {
      id: "showcase",
      label: "Components",
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      activeColor: "bg-purple-600 text-white",
    },
  ];

  const items = showStarter ? allItems : allItems.filter((i) => i.id !== "starter");

  return (
    <div className="sticky top-0 z-40 h-10 bg-card/95 backdrop-blur border-b border-border flex items-center justify-between px-3 md:px-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[#009de0] to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
          E
        </span>
        <span className="hidden sm:inline">Elio Scaffold</span>
      </div>
      <nav className="flex items-center gap-0.5">
        {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={[
                "flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium transition-colors",
                current === item.id
                  ? item.activeColor
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              ].join(" ")}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
        ))}
      </nav>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { i18n } = useTranslation();
  const [page, setPage] = useState<Page>(readPageFromHash);
  const [showStarter, setShowStarter] = useState(true);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Hide the Start tab once the consultant has registered their own agent.
  // The starter is an on-ramp — once the app exists, it's just clutter.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/agent-apps/scaffold-status");
        if (!r.ok) return;
        const data = (await r.json()) as { hasGeneratedAgent?: boolean };
        if (cancelled) return;
        if (data.hasGeneratedAgent) {
          setShowStarter(false);
          setPage((p) => (p === "starter" ? "showcase" : p));
        }
      } catch {
        /* starter route may be gone post-cleanup — ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the URL hash in sync with the active page.
  useEffect(() => {
    const hash = page === "starter" ? "" : `#${page}`;
    if (window.location.hash !== hash) window.location.hash = hash;
  }, [page]);

  // Listen to browser back/forward so the bar reflects the actual hash.
  useEffect(() => {
    const handler = () => setPage(readPageFromHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return (
    <AppErrorBoundary>
      <ScaffoldTopBar current={page} onChange={setPage} showStarter={showStarter} />
      <div className="pt-3 md:pt-5">
        {page === "starter" && showStarter && <StarterPage />}
        {page === "showcase" && <ShowcasePage />}
      </div>
    </AppErrorBoundary>
  );
}
