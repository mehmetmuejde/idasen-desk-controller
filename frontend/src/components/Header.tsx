import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConnectionStatus } from "@/types";
import { Circle, RefreshCw } from "lucide-react";
import logoImage from "@/assets/images/icon.png";

interface HeaderProps {
  status: ConnectionStatus;
  onRefresh: () => void;
}

/**
 * App header with logo and connection status indicator
 */
export function Header({ status, onRefresh }: HeaderProps) {
  const statusText = {
    CONNECTED: "Connected",
    NOT_CONNECTED: "Disconnected",
    UNKNOWN: "Unknown",
  };

  const statusColor = {
    CONNECTED: "text-green-500",
    NOT_CONNECTED: "text-red-500",
    UNKNOWN: "text-gray-400",
  };

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center">
        <img src={logoImage} alt="Logo" className="w-12 h-12" />
      </div>
      <div className="flex items-center gap-2">
        <Circle
          className={cn("h-3 w-3 fill-current", statusColor[status])}
        />
        <span className="text-sm text-muted-foreground">
          {statusText[status]}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          className="h-8 w-8"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
