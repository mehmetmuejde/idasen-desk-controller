import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogEntry } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";

interface LogPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

/**
 * Expandable log panel footer
 */
export function LogPanel({ logs, onClear }: LogPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <footer className="border-t">
      {/* Toggle button */}
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between p-3 h-auto rounded-none"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm text-muted-foreground">
          Logs ({logs.length})
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </Button>

      {/* Log content */}
      {open && (
        <div className="border-t">
          <div className="flex items-center justify-between px-3 py-1 bg-muted/50">
            <span className="text-xs text-muted-foreground">
              Recent messages
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-6 text-xs"
            >
              Clear
            </Button>
          </div>
          <div className="h-32 overflow-auto p-2 space-y-1">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No logs available
              </p>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-xs font-mono flex gap-2",
                    log.level === "ERROR" && "text-red-500",
                    log.level === "WARN" && "text-yellow-600",
                    log.level === "INFO" && "text-muted-foreground"
                  )}
                >
                  <span className="text-muted-foreground/60">
                    {log.timestamp}
                  </span>
                  <span
                    className={cn(
                      "font-semibold w-12",
                      log.level === "ERROR" && "text-red-500",
                      log.level === "WARN" && "text-yellow-600",
                      log.level === "INFO" && "text-blue-500"
                    )}
                  >
                    [{log.level}]
                  </span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </footer>
  );
}
