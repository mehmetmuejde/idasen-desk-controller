import { Button } from "@/components/ui/button";
import { Shortcut } from "@/types";
import { Plus } from "lucide-react";
import { ShortcutCard } from "./ShortcutCard";

interface ShortcutListProps {
  shortcuts: Shortcut[];
  disabled: boolean;
  onShortcutClick: (shortcut: Shortcut) => void;
  onEdit: (shortcut: Shortcut) => void;
  onDelete: (shortcut: Shortcut) => void;
  onAddNew: () => void;
}

/**
 * List of shortcut cards with add button
 */
export function ShortcutList({
  shortcuts,
  disabled,
  onShortcutClick,
  onEdit,
  onDelete,
  onAddNew,
}: ShortcutListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground">Shortcuts</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddNew}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          New
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {shortcuts.map((shortcut) => (
          <ShortcutCard
            key={shortcut.id}
            shortcut={shortcut}
            disabled={disabled}
            onClick={() => onShortcutClick(shortcut)}
            onEdit={() => onEdit(shortcut)}
            onDelete={() => onDelete(shortcut)}
          />
        ))}
        {shortcuts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No shortcuts available
          </p>
        )}
      </div>
    </div>
  );
}
