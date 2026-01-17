import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Shortcut } from "@/types";
import { Edit2, Trash2 } from "lucide-react";

interface ShortcutCardProps {
  shortcut: Shortcut;
  disabled: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Individual shortcut card with edit/delete actions
 */
export function ShortcutCard({
  shortcut,
  disabled,
  onClick,
  onEdit,
  onDelete,
}: ShortcutCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:bg-accent group",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !disabled && onClick()}
    >
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{shortcut.name}</div>
          <div className="text-sm text-muted-foreground">
            {shortcut.heightMM / 10} cm
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
