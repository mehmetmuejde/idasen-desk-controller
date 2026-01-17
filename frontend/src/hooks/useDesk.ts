import { useEffect, useRef, useState } from "react";
import { ConnectionStatus, LogEntry } from "@/types";
import {
  CheckConnection,
  GetHeight,
  MoveByStep,
  MoveToHeight,
} from "../../wailsjs/go/main/App";
import { EventsOff, EventsOn } from "../../wailsjs/runtime/runtime";

interface UseDeskOptions {
  onLog?: (entry: LogEntry) => void;
  onLocalLog?: (level: "INFO" | "WARN" | "ERROR", message: string) => void;
}

/**
 * Hook for desk communication and state management
 */
export function useDesk({ onLog, onLocalLog }: UseDeskOptions = {}) {
  const [height, setHeight] = useState<number | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("UNKNOWN");
  const [moving, setMoving] = useState(false);
  const initRef = useRef(false);

  // Initialize and set up event listeners
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Backend handles auto-connect, just set up listeners
    onLocalLog?.("INFO", "Initializing app...");
  }, []);

  // Event listeners for backend events
  useEffect(() => {
    const handleHeight = (heightMM: number) => {
      setHeight(heightMM / 10);
    };

    const handleLog = (entry: LogEntry) => {
      onLog?.(entry);
    };

    const handleConnection = (newStatus: string) => {
      setStatus(newStatus as ConnectionStatus);
    };

    EventsOn("height", handleHeight);
    EventsOn("log", handleLog);
    EventsOn("connection", handleConnection);

    return () => {
      EventsOff("height");
      EventsOff("log");
      EventsOff("connection");
    };
  }, [onLog]);

  // Refresh connection status and height
  const refresh = async () => {
    try {
      onLocalLog?.("INFO", "Refreshing status...");
      const connectionStatus = await CheckConnection();
      setStatus(connectionStatus as ConnectionStatus);

      const currentHeight = await GetHeight();
      setHeight(currentHeight / 10);
      onLocalLog?.("INFO", `Current height: ${(currentHeight / 10).toFixed(1)} cm`);
    } catch (e) {
      onLocalLog?.("ERROR", `Failed to refresh status: ${e}`);
    }
  };

  // Move desk by 1cm step
  const moveStep = async (up: boolean) => {
    if (moving) return;

    setMoving(true);
    try {
      await MoveByStep(up);
      const currentHeight = await GetHeight();
      setHeight(currentHeight / 10);
    } catch (e) {
      onLocalLog?.("ERROR", `Movement failed: ${e}`);
    } finally {
      setMoving(false);
    }
  };

  // Move desk to specific height
  const moveToHeight = async (heightMM: number, label?: string) => {
    if (moving) return;

    setMoving(true);
    if (label) {
      onLocalLog?.("INFO", `Moving to "${label}" (${heightMM / 10} cm)`);
    }
    try {
      await MoveToHeight(heightMM);
    } catch (e) {
      console.error("MoveToHeight error:", e);
    } finally {
      setMoving(false);
    }
  };

  return {
    height,
    status,
    moving,
    refresh,
    moveStep,
    moveToHeight,
  };
}
