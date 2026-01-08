"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  Clock,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ArrowRight,
  Building2,
  PlayCircle,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getPropertyUrl } from "@/lib/property-url";

interface Task {
  id: string;
  title: string;
  description: string | null;
  taskType: string;
  propertyId: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  assignedTo: { id: string; name: string; email: string; image: string | null } | null;
  createdBy: { id: string; name: string; email: string; image: string | null };
  property: { id: string; title: string; listingNumber: string | null; image: string; slug: string; provinceSlug: string | null; areaSlug: string | null } | null;
}

interface DueTasks {
  overdue: Task[];
  today: Task[];
  tomorrow: Task[];
  thisWeek: Task[];
  counts: {
    overdue: number;
    today: number;
    tomorrow: number;
    thisWeek: number;
    total: number;
  };
}

const PRIORITIES = {
  LOW: { color: "bg-green-500", label: "Low" },
  MEDIUM: { color: "bg-yellow-500", label: "Medium" },
  HIGH: { color: "bg-orange-500", label: "High" },
  URGENT: { color: "bg-red-500", label: "Urgent" },
};

export function TaskNotifications() {
  const [dueTasks, setDueTasks] = useState<DueTasks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // Fetch due tasks
  const fetchDueTasks = async () => {
    try {
      const response = await fetch("/api/tasks/due-today");
      const data = await response.json();

      if (response.ok) {
        setDueTasks(data);
        
        // Show welcome dialog if there are tasks due today/overdue (only once per session)
        if (!hasShownWelcome && (data.counts.overdue > 0 || data.counts.today > 0)) {
          const hasSeenToday = sessionStorage.getItem("taskNotificationShown");
          if (!hasSeenToday) {
            setShowWelcomeDialog(true);
            sessionStorage.setItem("taskNotificationShown", "true");
            setHasShownWelcome(true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching due tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDueTasks();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDueTasks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Quick status change
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(newStatus === "COMPLETED" ? "Task completed!" : "Status updated");
        fetchDueTasks();
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  // Calculate total urgent count (overdue + today)
  const urgentCount = dueTasks ? dueTasks.counts.overdue + dueTasks.counts.today : 0;

  return (
    <>
      {/* Bell Icon with Badge */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Task notifications"
          >
            <Bell className="h-5 w-5" />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <Badge
                  variant="destructive"
                  className="relative h-5 min-w-[20px] rounded-full px-1 text-[10px]"
                >
                  {urgentCount > 99 ? "99+" : urgentCount}
                </Badge>
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-0" align="end">
          <div className="border-b px-4 py-3">
            <h4 className="font-semibold">Tasks Overview</h4>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${dueTasks?.counts.total || 0} tasks today + overdue`}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {/* Overdue Tasks */}
              {dueTasks && dueTasks.overdue.length > 0 && (
                <TaskSection
                  title="Overdue"
                  icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                  tasks={dueTasks.overdue}
                  onStatusChange={handleStatusChange}
                  urgencyClass="bg-red-50 dark:bg-red-950/20"
                />
              )}

              {/* Today Tasks */}
              {dueTasks && dueTasks.today.length > 0 && (
                <TaskSection
                  title="Today"
                  icon={<Clock className="h-4 w-4 text-orange-500" />}
                  tasks={dueTasks.today}
                  onStatusChange={handleStatusChange}
                  urgencyClass="bg-orange-50 dark:bg-orange-950/10"
                />
              )}

              {/* Tomorrow Tasks */}
              {dueTasks && dueTasks.tomorrow.length > 0 && (
                <TaskSection
                  title="Tomorrow"
                  icon={<CalendarClock className="h-4 w-4 text-yellow-500" />}
                  tasks={dueTasks.tomorrow}
                  onStatusChange={handleStatusChange}
                />
              )}

              {/* No Tasks */}
              {dueTasks && dueTasks.counts.total === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground">
                    No tasks for today or overdue.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t px-4 py-3">
            <Link href="/dashboard/tasks" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" className="w-full justify-between">
                View all tasks
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      {/* Welcome Dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              Pending Tasks
            </DialogTitle>
            <DialogDescription>
              You have {urgentCount} {urgentCount === 1 ? "task" : "tasks"} that{" "}
              {urgentCount === 1 ? "requires" : "require"} attention
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              {dueTasks && dueTasks.counts.overdue > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {dueTasks.counts.overdue}
                    </div>
                    <div className="text-xs text-muted-foreground">Overdue</div>
                  </div>
                </div>
              )}
              {dueTasks && dueTasks.counts.today > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/10">
                  <Clock className="h-8 w-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {dueTasks.counts.today}
                    </div>
                    <div className="text-xs text-muted-foreground">Today</div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick task list */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {dueTasks?.overdue.slice(0, 3).map((task) => (
                <TaskQuickItem
                  key={task.id}
                  task={task}
                  onComplete={() => handleStatusChange(task.id, "COMPLETED")}
                  isOverdue
                />
              ))}
              {dueTasks?.today.slice(0, 3).map((task) => (
                <TaskQuickItem
                  key={task.id}
                  task={task}
                  onComplete={() => handleStatusChange(task.id, "COMPLETED")}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowWelcomeDialog(false)}
            >
              View later
            </Button>
            <Link href="/dashboard/tasks" className="flex-1">
              <Button className="w-full" onClick={() => setShowWelcomeDialog(false)}>
                Go to tasks
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Task Section Component
function TaskSection({
  title,
  icon,
  tasks,
  onStatusChange,
  urgencyClass = "",
}: {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  onStatusChange: (id: string, status: string) => void;
  urgencyClass?: string;
}) {
  return (
    <div className={cn("border-b last:border-b-0", urgencyClass)}>
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 dark:bg-slate-800/50">
        {icon}
        <span className="text-sm font-medium">{title}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {tasks.length}
        </Badge>
      </div>
      <div className="divide-y">
        {tasks.slice(0, 5).map((task) => (
          <TaskItem key={task.id} task={task} onStatusChange={onStatusChange} />
        ))}
        {tasks.length > 5 && (
          <div className="px-4 py-2 text-sm text-muted-foreground text-center">
            +{tasks.length - 5} more tasks
          </div>
        )}
      </div>
    </div>
  );
}

// Task Item Component
function TaskItem({
  task,
  onStatusChange,
}: {
  task: Task;
  onStatusChange: (id: string, status: string) => void;
}) {
  const priority = PRIORITIES[task.priority as keyof typeof PRIORITIES];

  return (
    <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex items-start gap-3">
        <span className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", priority.color)} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm line-clamp-1">{task.title}</div>
          {task.property && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Building2 className="h-3 w-3" />
              <span className="font-mono">{task.property.listingNumber}</span>
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={() => onStatusChange(task.id, "COMPLETED")}
        >
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Quick Item for Welcome Dialog
function TaskQuickItem({
  task,
  onComplete,
  isOverdue = false,
}: {
  task: Task;
  onComplete: () => void;
  isOverdue?: boolean;
}) {
  const priority = PRIORITIES[task.priority as keyof typeof PRIORITIES];

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg",
        isOverdue ? "bg-red-50 dark:bg-red-950/20" : "bg-slate-50 dark:bg-slate-800"
      )}
    >
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priority.color)} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium line-clamp-1">{task.title}</div>
        {task.dueDate && (
          <div className="text-xs text-muted-foreground">
            {isOverdue ? (
              <span className="text-red-600">
                {formatDistanceToNow(new Date(task.dueDate), { locale: enUS, addSuffix: true })}
              </span>
            ) : (
              format(new Date(task.dueDate), "HH:mm", { locale: enUS })
            )}
          </div>
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-green-600"
        onClick={onComplete}
      >
        <CheckCircle2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default TaskNotifications;
