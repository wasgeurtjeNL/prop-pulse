"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar as CalendarIcon,
  Building2,
  User,
  Loader2,
  ExternalLink,
  ArrowUpRight,
  XCircle,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
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
  completedById: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string; email: string; image: string | null } | null;
  createdBy: { id: string; name: string; email: string; image: string | null };
  completedBy: { id: string; name: string; email: string; image: string | null } | null;
  property: { id: string; title: string; listingNumber: string | null; image: string; slug: string; provinceSlug: string | null; areaSlug: string | null } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface Property {
  id: string;
  title: string;
  listingNumber: string | null;
}

const TASK_TYPES = [
  { value: "GENERAL", label: "General", color: "bg-slate-100 text-slate-700" },
  { value: "AGREEMENT", label: "Appointment", color: "bg-blue-100 text-blue-700" },
  { value: "DEVELOPMENT", label: "Development", color: "bg-purple-100 text-purple-700" },
  { value: "CLIENT", label: "Client", color: "bg-green-100 text-green-700" },
  { value: "IDEA", label: "Idea", color: "bg-yellow-100 text-yellow-700" },
  { value: "FOLLOW_UP", label: "Follow-up", color: "bg-orange-100 text-orange-700" },
  { value: "MAINTENANCE", label: "Maintenance", color: "bg-red-100 text-red-700" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "bg-green-100 text-green-700", icon: "🟢" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-700", icon: "🟡" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-700", icon: "🟠" },
  { value: "URGENT", label: "Urgent", color: "bg-red-100 text-red-700", icon: "🔴" },
];

const STATUSES = [
  { value: "OPEN", label: "Open", color: "bg-blue-100 text-blue-700", icon: Clock },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-purple-100 text-purple-700", icon: PlayCircle },
  { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  { value: "CANCELLED", label: "Cancelled", color: "bg-slate-100 text-slate-700", icon: XCircle },
  { value: "POSTPONED", label: "Postponed", color: "bg-orange-100 text-orange-700", icon: PauseCircle },
];

export function TasksTable({ propertyId }: { propertyId?: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    taskType: "GENERAL",
    propertyId: propertyId || "",
    priority: "MEDIUM",
    dueDate: null as Date | null,
    reminderDate: null as Date | null,
    assignedToId: "",
  });

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (propertyId) params.set("propertyId", propertyId);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (typeFilter !== "all") params.set("taskType", typeFilter);

      const response = await fetch(`/api/tasks?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setTasks(data.tasks);
      } else {
        toast.error(data.error || "Failed to load tasks");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users (for assignment dropdown)
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

  // Fetch properties (for property dropdown)
  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/properties/list");
      const data = await response.json();
      if (response.ok) {
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    if (!propertyId) {
      fetchProperties();
    }
  }, [statusFilter, priorityFilter, typeFilter, propertyId]);

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
          propertyId: formData.propertyId || null,
          assignedToId: formData.assignedToId || null,
          dueDate: formData.dueDate?.toISOString() || null,
          reminderDate: formData.reminderDate?.toISOString() || null,
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

  // Update task
  const handleUpdate = async () => {
    if (!selectedTask || !formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          propertyId: formData.propertyId || null,
          assignedToId: formData.assignedToId || null,
          dueDate: formData.dueDate?.toISOString() || null,
          reminderDate: formData.reminderDate?.toISOString() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Task updated!");
        setIsEditOpen(false);
        setSelectedTask(null);
        resetForm();
        fetchTasks();
      } else {
        toast.error(data.error || "Failed to update task");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick status update
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
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  // Delete task
  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Task deleted!");
        fetchTasks();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete task");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      taskType: "GENERAL",
      propertyId: propertyId || "",
      priority: "MEDIUM",
      dueDate: null,
      reminderDate: null,
      assignedToId: "",
    });
  };

  // Open edit dialog
  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      taskType: task.taskType,
      propertyId: task.propertyId || "",
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      reminderDate: task.reminderDate ? new Date(task.reminderDate) : null,
      assignedToId: task.assignedToId || "",
    });
    setIsEditOpen(true);
  };

  // Get priority config
  const getPriorityConfig = (priority: string) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];
  };

  // Get status config
  const getStatusConfig = (status: string) => {
    return STATUSES.find(s => s.value === status) || STATUSES[0];
  };

  // Get type config
  const getTypeConfig = (type: string) => {
    return TASK_TYPES.find(t => t.value === type) || TASK_TYPES[0];
  };

  // Get due date display
  const getDueDateDisplay = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    const isOverdue = isPast(date) && !isToday(date);
    
    let label = format(date, "d MMM", { locale: enUS });
    let urgencyClass = "";
    
    if (isOverdue) {
      label = `${formatDistanceToNow(date, { locale: enUS, addSuffix: true })}`;
      urgencyClass = "text-red-600 font-medium";
    } else if (isToday(date)) {
      label = "Today";
      urgencyClass = "text-orange-600 font-medium";
    } else if (isTomorrow(date)) {
      label = "Tomorrow";
      urgencyClass = "text-yellow-600";
    }
    
    return { label, urgencyClass, isOverdue };
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
      {/* Header with filters and create button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITIES.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {TASK_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Tasks Table */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new task to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-md border bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[700px] w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">Prio</TableHead>
                <TableHead>Task</TableHead>
                <TableHead className="w-[100px] hidden sm:table-cell">Type</TableHead>
                {!propertyId && <TableHead className="w-[140px] hidden lg:table-cell">Property</TableHead>}
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px] hidden md:table-cell">Due Date</TableHead>
                <TableHead className="w-[120px] hidden md:table-cell">Assigned</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const priorityConfig = getPriorityConfig(task.priority);
                const statusConfig = getStatusConfig(task.status);
                const typeConfig = getTypeConfig(task.taskType);
                const dueDisplay = getDueDateDisplay(task.dueDate);
                const StatusIcon = statusConfig.icon;

                return (
                  <TableRow key={task.id} className={cn(
                    task.status === "COMPLETED" && "opacity-60",
                    dueDisplay?.isOverdue && task.status !== "COMPLETED" && "bg-red-50 dark:bg-red-950/20"
                  )}>
                    <TableCell>
                      <span title={priorityConfig.label}>{priorityConfig.icon}</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium line-clamp-1">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className={cn("text-xs", typeConfig.color)}>
                        {typeConfig.label}
                      </Badge>
                    </TableCell>
                    {!propertyId && (
                      <TableCell className="hidden lg:table-cell">
                        {task.property ? (
                          <Link
                            href={getPropertyUrl(task.property)}
                            target="_blank"
                            className="flex items-center gap-2 hover:text-purple-600 transition-colors group"
                          >
                            <div className="relative h-8 w-12 overflow-hidden rounded flex-shrink-0">
                              <Image
                                src={task.property.image}
                                alt={task.property.title}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {task.property.listingNumber}
                              </span>
                            </div>
                            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {STATUSES.map(s => {
                            const Icon = s.icon;
                            return (
                              <DropdownMenuItem
                                key={s.value}
                                onClick={() => handleStatusChange(task.id, s.value)}
                                className={cn(task.status === s.value && "bg-slate-100")}
                              >
                                <Icon className="h-4 w-4 mr-2" />
                                {s.label}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {dueDisplay ? (
                        <span className={cn("text-sm", dueDisplay.urgencyClass)}>
                          {dueDisplay.isOverdue && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                          {dueDisplay.label}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          {task.assignedTo.image ? (
                            <Image
                              src={task.assignedTo.image}
                              alt={task.assignedTo.name}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center">
                              <User className="h-3 w-3 text-slate-500" />
                            </div>
                          )}
                          <span className="text-sm truncate max-w-[80px]">
                            {task.assignedTo.name?.split(" ")[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(task)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {task.status !== "COMPLETED" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, "COMPLETED")}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                              Mark as completed
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(task.id)}
                            className="text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>
              Create a new task to track.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            formData={formData}
            setFormData={setFormData}
            users={users}
            properties={properties}
            showPropertySelect={!propertyId}
          />
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

      {/* Edit Task Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            formData={formData}
            setFormData={setFormData}
            users={users}
            properties={properties}
            showPropertySelect={!propertyId}
            isEdit
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task Form Component
function TaskForm({
  formData,
  setFormData,
  users,
  properties,
  showPropertySelect,
  isEdit = false,
}: {
  formData: {
    title: string;
    description: string;
    taskType: string;
    propertyId: string;
    priority: string;
    dueDate: Date | null;
    reminderDate: Date | null;
    assignedToId: string;
  };
  setFormData: (data: any) => void;
  users: User[];
  properties: Property[];
  showPropertySelect: boolean;
  isEdit?: boolean;
}) {
  return (
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
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
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
      
      {showPropertySelect && (
        <div className="space-y-2">
          <Label>Property (optional)</Label>
          <Select
            value={formData.propertyId || "none"}
            onValueChange={(value) => setFormData({ ...formData, propertyId: value === "none" ? "" : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select property..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No property</SelectItem>
              {properties.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.listingNumber ? `${p.listingNumber} - ` : ""}{p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
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
      
      <div className="grid grid-cols-2 gap-4">
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
                {formData.dueDate ? format(formData.dueDate, "d MMM yyyy", { locale: enUS }) : "Pick a date"}
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
          <Label>Reminder</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.reminderDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.reminderDate ? format(formData.reminderDate, "d MMM yyyy", { locale: enUS }) : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.reminderDate || undefined}
                onSelect={(date) => setFormData({ ...formData, reminderDate: date || null })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

export default TasksTable;
