import { useEffect, useState } from "react";
import { LogEntry, LogLevel, STORAGE_KEYS } from "@/types";

const MAX_LOGS = 100;

/**
 * Hook for managing application logs with localStorage persistence
 */
export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load logs:", e);
    }
    return [];
  });

  // Persist logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to save logs:", e);
    }
  }, [logs]);

  // Add a new log entry
  const addLog = (level: LogLevel, message: string) => {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    };
    setLogs((prev) => [entry, ...prev].slice(0, MAX_LOGS));
  };

  // Add log entry from backend event
  const addLogEntry = (entry: LogEntry) => {
    setLogs((prev) => [entry, ...prev].slice(0, MAX_LOGS));
  };

  // Clear all logs
  const clearLogs = () => {
    setLogs([]);
  };

  return { logs, addLog, addLogEntry, clearLogs };
}
