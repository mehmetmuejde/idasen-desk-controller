import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shortcut, MIN_HEIGHT_MM, MAX_HEIGHT_MM } from "@/types";
import { X } from "lucide-react";

interface ShortcutDialogProps {
  open: boolean;
  editingShortcut: Shortcut | null;
  currentHeight: number | null;
  onClose: () => void;
  onSave: (name: string, heightMM: number) => void;
}

/**
 * Modal dialog for creating/editing shortcuts
 */
export function ShortcutDialog({
  open,
  editingShortcut,
  currentHeight,
  onClose,
  onSave,
}: ShortcutDialogProps) {
  const [name, setName] = useState("");
  const [height, setHeight] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (editingShortcut) {
        setName(editingShortcut.name);
        setHeight((editingShortcut.heightMM / 10).toString());
      } else {
        setName("");
        setHeight(currentHeight ? currentHeight.toString() : "85");
      }
    }
  }, [open, editingShortcut, currentHeight]);

  const handleSave = () => {
    const heightCM = parseFloat(height);
    if (!name.trim() || isNaN(heightCM)) return;

    const heightMM = Math.round(heightCM * 10);
    if (heightMM < MIN_HEIGHT_MM || heightMM > MAX_HEIGHT_MM) return;

    onSave(name.trim(), heightMM);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-background border rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold mb-1">
          {editingShortcut ? "Edit Shortcut" : "New Shortcut"}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Create a shortcut for a frequently used height.
        </p>

        <div className="space-y-4">
          {/* Name input */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <span className="text-xs text-muted-foreground">
                {name.length}/32
              </span>
            </div>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sitting, Standing..."
              maxLength={32}
            />
          </div>

          {/* Height slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label htmlFor="height" className="text-sm font-medium">
                Height
              </label>
              <span className="text-sm font-medium">
                {height ? parseFloat(height).toFixed(1) : "—"} cm
              </span>
            </div>
            <input
              id="height"
              type="range"
              value={height || MIN_HEIGHT_MM / 10}
              onChange={(e) => setHeight(e.target.value)}
              min={MIN_HEIGHT_MM / 10}
              max={MAX_HEIGHT_MM / 10}
              step={0.5}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{MIN_HEIGHT_MM / 10} cm</span>
              <span>{MAX_HEIGHT_MM / 10} cm</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
