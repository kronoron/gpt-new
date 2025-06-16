import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/lib/types";
import { ROLES } from "@/lib/types";

interface ScenarioCardProps {
  scenario: Scenario;
  onClick: () => void;
}

export default function ScenarioCard({ scenario, onClick }: ScenarioCardProps) {
  const roleConfig = ROLES.find(r => r.value === scenario.role);
  const roleColor = roleConfig?.color || 'role-ae';

  return (
    <Card 
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-slate-900 dark:text-white">{scenario.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{scenario.description}</p>
            <div className="flex items-center mt-2 space-x-2">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs",
                  `bg-${roleColor} bg-opacity-10`,
                  `text-${roleColor}`
                )}
              >
                {roleConfig?.label || scenario.role} Focus
              </Badge>
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                <Clock className="h-3 w-3 mr-1" />
                ~{scenario.estimatedDuration} min
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 ml-4" />
        </div>
      </CardContent>
    </Card>
  );
}
