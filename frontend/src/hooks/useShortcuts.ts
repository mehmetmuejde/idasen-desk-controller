import { useEffect, useState } from "react";
import { DEFAULT_SHORTCUTS, Shortcut, STORAGE_KEYS } from "@/types";

/**
 * Hook for managing shortcuts with localStorage persistence
 */
export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHORTCUTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load shortcuts:", e);
    }
    return DEFAULT_SHORTCUTS;
  });

  // Persist shortcuts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHORTCUTS, JSON.stringify(shortcuts));
    } catch (e) {
      console.error("Failed to save shortcuts:", e);
    }
  }, [shortcuts]);

  // Add a new shortcut
  const addShortcut = (name: string, heightMM: number) => {
    const newShortcut: Shortcut = {
      id: Date.now().toString(),
      name,
      heightMM,
    };
    setShortcuts((prev) => [...prev, newShortcut]);
  };

  // Update an existing shortcut
  const updateShortcut = (id: string, name: string, heightMM: number) => {
    setShortcuts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name, heightMM } : s))
    );
  };

  // Delete a shortcut
  const deleteShortcut = (id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  };

  return { shortcuts, addShortcut, updateShortcut, deleteShortcut };
}
