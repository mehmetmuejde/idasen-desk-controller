// Connection status types
export type ConnectionStatus = "CONNECTED" | "NOT_CONNECTED" | "UNKNOWN";

// Log types
export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
}

// Shortcut types
export interface Shortcut {
  id: string;
  name: string;
  heightMM: number;
}

// Height constants
export const MIN_HEIGHT_MM = 620;
export const MAX_HEIGHT_MM = 1270;

// Storage keys
export const STORAGE_KEYS = {
  SHORTCUTS: "desk-shortcuts",
  LOGS: "desk-logs",
} as const;

// Default shortcuts
export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: "1", name: "Sitting", heightMM: 850 },
  { id: "2", name: "Standing", heightMM: 1180 },
];
