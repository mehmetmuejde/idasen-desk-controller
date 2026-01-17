import { useState } from "react";
import {
  Header,
  HeightDisplay,
  LogPanel,
  ShortcutDialog,
  ShortcutList,
} from "@/components";
import { useDesk, useLogs, useShortcuts } from "@/hooks";
import { Shortcut } from "@/types";

/**
 * Main application component
 */
const App = () => {
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);

  // Custom hooks
  const { logs, addLog, addLogEntry, clearLogs } = useLogs();
  const { shortcuts, addShortcut, updateShortcut, deleteShortcut } = useShortcuts();
  const { height, status, moving, refresh, moveStep, moveToHeight } = useDesk({
    onLog: addLogEntry,
    onLocalLog: addLog,
  });

  // Shortcut handlers
  const handleShortcutClick = (shortcut: Shortcut) => {
    moveToHeight(shortcut.heightMM, shortcut.name);
  };

  const handleAddShortcut = () => {
    setEditingShortcut(null);
    setDialogOpen(true);
  };

  const handleEditShortcut = (shortcut: Shortcut) => {
    setEditingShortcut(shortcut);
    setDialogOpen(true);
  };

  const handleDeleteShortcut = (shortcut: Shortcut) => {
    deleteShortcut(shortcut.id);
    addLog("INFO", `Shortcut "${shortcut.name}" deleted`);
  };

  const handleSaveShortcut = (name: string, heightMM: number) => {
    if (editingShortcut) {
      updateShortcut(editingShortcut.id, name, heightMM);
      addLog("INFO", `Shortcut "${name}" updated`);
    } else {
      addShortcut(name, heightMM);
      addLog("INFO", `Shortcut "${name}" added`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header status={status} onRefresh={refresh} />

      <main className="flex-1 p-4 overflow-auto">
        <div className="flex flex-col gap-6 max-w-md mx-auto">
          <HeightDisplay
            height={height}
            moving={moving}
            onMoveStep={moveStep}
          />

          <ShortcutList
            shortcuts={shortcuts}
            disabled={moving}
            onShortcutClick={handleShortcutClick}
            onEdit={handleEditShortcut}
            onDelete={handleDeleteShortcut}
            onAddNew={handleAddShortcut}
          />
        </div>
      </main>

      <LogPanel logs={logs} onClear={clearLogs} />

      <ShortcutDialog
        open={dialogOpen}
        editingShortcut={editingShortcut}
        currentHeight={height}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveShortcut}
      />
    </div>
  );
};

export default App;
