import { Card, CardContent } from "@/components/ui/card";
import { Trophy, MessageCircle, Clock, TrendingUp } from "lucide-react";
import type { User } from "@/lib/types";

interface StatsOverviewProps {
  user: User;
}

export default function StatsOverview({ user }: StatsOverviewProps) {
  const improvementPercentage = user.sessionsCompleted > 0 ? 15 : 0; // Mock improvement calculation

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                <Trophy className="h-4 w-4 text-success" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Overall Score</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{user.overallScore}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sessions Completed</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{user.sessionsCompleted}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Training Hours</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {(user.trainingHours / 60).toFixed(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Improvement</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                +{improvementPercentage}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
