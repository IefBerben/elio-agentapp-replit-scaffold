import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/**
 * Language toggle button (FR / EN).
 * Switches the i18next language, which propagates to the entire app
 * and is forwarded to the backend via ``interface_language`` in SSE payloads.
 */
export function LanguageToggle() {
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith("fr") ? "fr" : "en";

  return (
    <div className="flex items-center bg-muted rounded-full p-1">
      <button
        onClick={() => i18n.changeLanguage("en")}
        className={cn(
          "px-3 py-1 text-xs font-semibold rounded-full transition-all",
          language === "en"
            ? "bg-card shadow text-blue-600"
            : "text-muted-foreground hover:text-muted-foreground",
        )}
      >
        EN
      </button>
      <button
        onClick={() => i18n.changeLanguage("fr")}
        className={cn(
          "px-3 py-1 text-xs font-semibold rounded-full transition-all",
          language === "fr"
            ? "bg-card shadow text-blue-600"
            : "text-muted-foreground hover:text-muted-foreground",
        )}
      >
        FR
      </button>
    </div>
  );
}
