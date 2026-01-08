"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar as CalendarIcon,
  PlayCircle,
  Loader2,
  ListTodo,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { enUS } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  taskType: string;
  priority: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const TASK_TYPES = [
  { value: "GENERAL", label: "General" },
  { value: "AGREEMENT", label: "Appointment" },
  { value: "DEVELOPMENT", label: "Development" },
  { value: "CLIENT", label: "Client" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low", icon: "🟢" },
  { value: "MEDIUM", label: "Medium", icon: "🟡" },
  { value: "HIGH", label: "High", icon: "🟠" },
  { value: "URGENT", label: "Urgent", icon: "🔴" },
];

const STATUSES = {
  OPEN: { label: "Open", color: "bg-blue-100 text-blue-700", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "bg-purple-100 text-purple-700", icon: PlayCircle },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
};

export function PropertyTasksWidget({ propertyId }: { propertyId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    taskType: "GENERAL",
    priority: "MEDIUM",
    dueDate: null as Date | null,
    assignedToId: "",
  });

  // Fetch tasks for this property
  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?propertyId=${propertyId}`);
      const data = await response.json();
      
      if (response.ok) {
        // Filter out completed tasks older than 7 days, show max 10
        const activeTasks = data.tasks
          .filter((t: Task) => {
            if (t.status === "COMPLETED") {
              const completedDate = new Date(t.createdAt);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return completedDate > weekAgo;
            }
            return true;
          })
          .slice(0, 10);
        setTasks(activeTasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users for assignment
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [propertyId]);

  // Create task
  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          propertyId,
          assignedToId: formData.assignedToId || null,
          dueDate: formData.dueDate?.toISOString() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Task created!");
        setIsCreateOpen(false);
        resetForm();
        fetchTasks();
      } else {
        toast.error(data.error || "Failed to create task");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        fetchTasks();
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      taskType: "GENERAL",
      priority: "MEDIUM",
      dueDate: null,
      assignedToId: "",
    });
  };

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority)?.icon || "🟡";
  };

  // Get due date display
  const getDueDateDisplay = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    const isOverdue = isPast(date) && !isToday(date);
    
    if (isOverdue) {
      return {
        label: formatDistanceToNow(date, { locale: enUS, addSuffix: true }),
        className: "text-red-600 font-medium",
      };
    } else if (isToday(date)) {
      return { label: "Today", className: "text-orange-600 font-medium" };
    }
    
    return {
      label: format(date, "d MMM", { locale: enUS }),
      className: "text-muted-foreground",
    };
  };

  // Count active tasks
  const activeCount = tasks.filter(t => t.status !== "COMPLETED").length;
  const overdueCount = tasks.filter(t => {
    if (t.status === "COMPLETED" || !t.dueDate) return false;
    return isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate));
  }).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">Tasks</CardTitle>
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeCount}
              </Badge>
            )}
            {overdueCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {overdueCount} overdue
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/dashboard/tasks?propertyId=${propertyId}`}>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                All tasks
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
            <Button size="sm" className="h-8" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
            <p>No tasks for this property</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="mt-1"
            >
              Create first task
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const status = STATUSES[task.status as keyof typeof STATUSES];
              const StatusIcon = status?.icon || Clock;
              const dueDisplay = getDueDateDisplay(task.dueDate);
              const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                    task.status === "COMPLETED" && "opacity-60 bg-slate-50",
                    isOverdue && task.status !== "COMPLETED" && "bg-red-50 border-red-200"
                  )}
                >
                  <span className="text-sm" title={PRIORITIES.find(p => p.value === task.priority)?.label}>
                    {getPriorityIcon(task.priority)}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-sm font-medium line-clamp-1",
                      task.status === "COMPLETED" && "line-through"
                    )}>
                      {task.title}
                    </div>
                    {dueDisplay && (
                      <div className={cn("text-xs flex items-center gap-1", dueDisplay.className)}>
                        {isOverdue && <AlertTriangle className="h-3 w-3" />}
                        <CalendarIcon className="h-3 w-3" />
                        {dueDisplay.label}
                      </div>
                    )}
                  </div>

                  {/* Quick actions */}
                  {task.status !== "COMPLETED" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleStatusChange(task.id, "COMPLETED")}
                      title="Mark as completed"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleStatusChange(task.id, "OPEN")}
                      title="Reopen"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>
              Add a task for this property.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What needs to be done?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.taskType}
                  onValueChange={(value) => setFormData({ ...formData, taskType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dueDate ? format(formData.dueDate, "d MMM", { locale: enUS }) : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.dueDate || undefined}
                      onSelect={(date) => setFormData({ ...formData, dueDate: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Assigned to</Label>
                <Select
                  value={formData.assignedToId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, assignedToId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default PropertyTasksWidget;
