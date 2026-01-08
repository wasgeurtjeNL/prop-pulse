"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  PlayCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isPast,
} from "date-fns";
import { enUS } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
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
  reminderDate: string | null;
  assignedToId: string | null;
  createdById: string;
  completedAt: string | null;
  createdAt: string;
  assignedTo: { id: string; name: string; email: string; image: string | null } | null;
  createdBy: { id: string; name: string; email: string; image: string | null };
  property: { id: string; title: string; listingNumber: string | null; image: string; slug: string; provinceSlug: string | null; areaSlug: string | null } | null;
}

const PRIORITIES = {
  LOW: { color: "bg-green-500", label: "Low" },
  MEDIUM: { color: "bg-yellow-500", label: "Medium" },
  HIGH: { color: "bg-orange-500", label: "High" },
  URGENT: { color: "bg-red-500", label: "Urgent" },
};

const TASK_TYPES = {
  GENERAL: { label: "General", color: "slate" },
  AGREEMENT: { label: "Appointment", color: "blue" },
  DEVELOPMENT: { label: "Development", color: "purple" },
  CLIENT: { label: "Client", color: "green" },
  IDEA: { label: "Idea", color: "yellow" },
  FOLLOW_UP: { label: "Follow-up", color: "orange" },
  MAINTENANCE: { label: "Maintenance", color: "red" },
};

const STATUSES = {
  OPEN: { icon: Clock, color: "text-blue-600" },
  IN_PROGRESS: { icon: PlayCircle, color: "text-purple-600" },
  COMPLETED: { icon: CheckCircle2, color: "text-green-600" },
};

export function TasksCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);

  // Fetch tasks for the current month range
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      
      // Get tasks that have a due date (for calendar view)
      const start = startOfMonth(subMonths(currentMonth, 1));
      const end = endOfMonth(addMonths(currentMonth, 1));

      const params = new URLSearchParams({
        dueAfter: start.toISOString(),
        dueBefore: end.toISOString(),
      });

      const response = await fetch(`/api/tasks?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setTasks(data.tasks.filter((t: Task) => t.dueDate));
      } else {
        toast.error("Failed to load tasks");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentMonth]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    
    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(task);
      }
    });
    
    // Sort tasks within each day by priority
    grouped.forEach((dayTasks, key) => {
      dayTasks.sort((a, b) => {
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
      });
    });
    
    return grouped;
  }, [tasks]);

  // Navigate months
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Handle day click
  const handleDayClick = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayTasks = tasksByDate.get(dateKey) || [];
    setSelectedDay(day);
    setSelectedDayTasks(dayTasks);
  };

  // Update task status
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(newStatus === "COMPLETED" ? "Task completed!" : "Status updated");
        fetchTasks();
        // Update selected day tasks
        if (selectedDay) {
          const dateKey = format(selectedDay, "yyyy-MM-dd");
          const updatedTasks = tasksByDate.get(dateKey) || [];
          setSelectedDayTasks(updatedTasks);
        }
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale: enUS })}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={goToToday}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800 border-b">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const hasOverdue = dayTasks.some(
              (t) => t.status !== "COMPLETED" && isPast(new Date(t.dueDate!)) && !isToday(new Date(t.dueDate!))
            );

            const tooltipContent = dayTasks.length > 0 ? (
              <div className="space-y-1">
                <div className="font-medium">
                  {format(day, "d MMMM", { locale: enUS })}
                </div>
                <div className="text-xs opacity-75">
                  {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
                </div>
                <div className="pt-1 space-y-0.5">
                  {dayTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="text-xs flex items-center gap-1">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          PRIORITIES[task.priority as keyof typeof PRIORITIES].color
                        )}
                      />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <span>No tasks</span>
            );

            return (
              <Tooltip key={idx} content={tooltipContent} side="bottom">
                <button
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-[100px] p-2 border-r border-b text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-800/20",
                    isTodayDate && "bg-blue-50 dark:bg-blue-950/20",
                    hasOverdue && "bg-red-50/50 dark:bg-red-950/20"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-medium mb-1",
                      !isCurrentMonth && "text-muted-foreground",
                      isTodayDate && "text-blue-600 font-bold"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  
                  {/* Task indicators */}
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => {
                      const priority = PRIORITIES[task.priority as keyof typeof PRIORITIES];
                      const isCompleted = task.status === "COMPLETED";
                      
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded truncate flex items-center gap-1",
                            isCompleted
                              ? "bg-slate-100 text-slate-500 line-through"
                              : "bg-slate-100 dark:bg-slate-800"
                          )}
                        >
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full flex-shrink-0",
                              isCompleted ? "bg-green-500" : priority.color
                            )}
                          />
                          <span className="truncate">{task.title}</span>
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1.5">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && format(selectedDay, "EEEE, MMMM d, yyyy", { locale: enUS })}
            </DialogTitle>
            <DialogDescription>
              {selectedDayTasks.length === 0
                ? "No tasks scheduled"
                : `${selectedDayTasks.length} ${selectedDayTasks.length === 1 ? "task" : "tasks"}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedDayTasks.map((task) => {
              const priority = PRIORITIES[task.priority as keyof typeof PRIORITIES];
              const taskType = TASK_TYPES[task.taskType as keyof typeof TASK_TYPES];
              const status = STATUSES[task.status as keyof typeof STATUSES];
              const StatusIcon = status?.icon || Clock;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "p-3 border rounded-lg space-y-2",
                    task.status === "COMPLETED" && "opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                          task.status === "COMPLETED" ? "bg-green-500" : priority.color
                        )}
                      />
                      <div>
                        <div className={cn(
                          "font-medium",
                          task.status === "COMPLETED" && "line-through"
                        )}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {taskType?.label || task.taskType}
                      </Badge>
                      <StatusIcon className={cn("h-4 w-4", status?.color)} />
                    </div>
                  </div>

                  {/* Property link */}
                  {task.property && (
                    <Link
                      href={getPropertyUrl(task.property)}
                      target="_blank"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-purple-600 transition-colors"
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">
                        {task.property.listingNumber}
                      </span>
                      <span className="truncate">{task.property.title}</span>
                    </Link>
                  )}

                  {/* Quick actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {task.status !== "COMPLETED" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                        >
                          <PlayCircle className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-green-600 hover:text-green-700"
                          onClick={() => handleStatusChange(task.id, "COMPLETED")}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                      </>
                    )}
                    {task.status === "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleStatusChange(task.id, "OPEN")}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Reopen
                      </Button>
                    )}
                    <Link href={`/dashboard/tasks?edit=${task.id}`}>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TasksCalendar;
