import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MIN_HEIGHT_MM, MAX_HEIGHT_MM } from "@/types";
import { Minus, Plus } from "lucide-react";

interface HeightDisplayProps {
  height: number | null;
  moving: boolean;
  onMoveStep: (up: boolean) => void;
}

/**
 * Height display card with progress bar and control buttons
 */
export function HeightDisplay({ height, moving, onMoveStep }: HeightDisplayProps) {
  // Calculate progress percentage (0-100)
  const heightProgress =
    height !== null
      ? ((height * 10 - MIN_HEIGHT_MM) / (MAX_HEIGHT_MM - MIN_HEIGHT_MM)) * 100
      : 0;

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Height value */}
        <div className="text-center mb-4">
          <span className="text-5xl font-bold tabular-nums">
            {height !== null ? height.toFixed(1) : "—"}
          </span>
          <span className="text-2xl text-muted-foreground ml-1">cm</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={heightProgress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{MIN_HEIGHT_MM / 10} cm</span>
            <span>{MAX_HEIGHT_MM / 10} cm</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <Button
            onClick={() => onMoveStep(false)}
            variant="outline"
            disabled={moving}
            size="lg"
          >
            <Minus color="red" />
          </Button>
          <Button
            onClick={() => onMoveStep(true)}
            variant="outline"
            disabled={moving}
            size="lg"
          >
            <Plus color="green" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
