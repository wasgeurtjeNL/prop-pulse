"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  GripVertical,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  Sparkles,
  Settings,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ScheduledBlog {
  id: string;
  topicId?: string;
  topicTitle: string;
  scheduledFor: string;
  status: "SCHEDULED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  language: string;
  length: string;
  tone: string;
  generatedBlogId?: string;
}

interface PublishedBlog {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
}

interface ScheduleSettings {
  maxBlogsPerWeek: number;
  minDaysBetweenPosts: number;
  preferredPostTime: string;
  preferredPostDays: string[];
}

interface TopicSuggestion {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  status: string;
  matchesExistingBlog?: boolean;
}

interface BlogCalendarProps {
  topics?: TopicSuggestion[];
  onTopicScheduled?: (topicId: string) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function BlogCalendar({ topics = [], onTopicScheduled }: BlogCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledBlogs, setScheduledBlogs] = useState<ScheduledBlog[]>([]);
  const [publishedBlogs, setPublishedBlogs] = useState<PublishedBlog[]>([]);
  const [settings, setSettings] = useState<ScheduleSettings>({
    maxBlogsPerWeek: 3,
    minDaysBetweenPosts: 2,
    preferredPostTime: "09:00",
    preferredPostDays: ["Monday", "Wednesday", "Friday"]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTopic, setDraggedTopic] = useState<TopicSuggestion | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  
  // Dialog states
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicSuggestion | null>(null);
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [isScheduling, setIsScheduling] = useState(false);

  // Settings dialog
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editSettings, setEditSettings] = useState<ScheduleSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Fetch schedule data
  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
      const response = await fetch(`/api/smart-blog/schedule?month=${month}`);
      const data = await response.json();
      
      if (response.ok) {
        setScheduledBlogs(data.scheduledBlogs || []);
        setPublishedBlogs(data.publishedBlogs || []);
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Add days from previous month
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };

  // Get blogs for a specific date
  const getBlogsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    
    const scheduled = scheduledBlogs.filter(blog => {
      const blogDate = new Date(blog.scheduledFor).toISOString().split("T")[0];
      return blogDate === dateStr;
    });
    
    const published = publishedBlogs.filter(blog => {
      const blogDate = new Date(blog.publishedAt).toISOString().split("T")[0];
      return blogDate === dateStr;
    });
    
    return { scheduled, published };
  };

  // Check if date is valid for scheduling - returns { allowed: boolean, reason?: string }
  const canScheduleOnDate = (date: Date): { allowed: boolean; reason?: string } => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Can't schedule in the past
    if (date < now) {
      return { 
        allowed: false, 
        reason: "📅 Je kunt niet in het verleden inplannen. Kies een datum in de toekomst." 
      };
    }
    
    // Check if there's already a blog on this date
    const { scheduled, published } = getBlogsForDate(date);
    if (scheduled.length > 0) {
      return { 
        allowed: false, 
        reason: "⚠️ Er staat al een blog ingepland op deze datum. Kies een andere dag." 
      };
    }
    if (published.length > 0) {
      return { 
        allowed: false, 
        reason: "✅ Er is al een blog gepubliceerd op deze datum. Kies een andere dag." 
      };
    }
    
    // Check minimum days between posts (SEO best practice)
    for (let i = 1; i <= settings.minDaysBetweenPosts; i++) {
      const beforeDate = new Date(date);
      beforeDate.setDate(beforeDate.getDate() - i);
      const afterDate = new Date(date);
      afterDate.setDate(afterDate.getDate() + i);
      
      const beforeBlogs = getBlogsForDate(beforeDate);
      const afterBlogs = getBlogsForDate(afterDate);
      
      if (beforeBlogs.scheduled.length > 0 || beforeBlogs.published.length > 0) {
        const daysAgo = i;
        return { 
          allowed: false, 
          reason: `🚫 Te dicht bij een andere blog! Voor optimale SEO moeten er minimaal ${settings.minDaysBetweenPosts} dagen tussen posts zitten. Er is ${daysAgo} dag${daysAgo > 1 ? 'en' : ''} geleden al een blog.` 
        };
      }
      
      if (afterBlogs.scheduled.length > 0 || afterBlogs.published.length > 0) {
        const daysAhead = i;
        return { 
          allowed: false, 
          reason: `🚫 Te dicht bij een andere blog! Voor optimale SEO moeten er minimaal ${settings.minDaysBetweenPosts} dagen tussen posts zitten. Er is ${daysAhead} dag${daysAhead > 1 ? 'en' : ''} later al een blog.` 
        };
      }
    }
    
    // Check max blogs per week
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    let blogsThisWeek = 0;
    for (let d = new Date(weekStart); d < weekEnd; d.setDate(d.getDate() + 1)) {
      const dayBlogs = getBlogsForDate(new Date(d));
      blogsThisWeek += dayBlogs.scheduled.length + dayBlogs.published.length;
    }
    
    if (blogsThisWeek >= settings.maxBlogsPerWeek) {
      return { 
        allowed: false, 
        reason: `📊 Maximum van ${settings.maxBlogsPerWeek} blogs per week bereikt! Te veel blogs in korte tijd kan schadelijk zijn voor je SEO. Kies een datum in een andere week.` 
      };
    }
    
    return { allowed: true };
  };
  
  // Simple boolean check for styling
  const isDateAvailable = (date: Date): boolean => {
    return canScheduleOnDate(date).allowed;
  };

  // Drag and drop handlers
  const handleDragStart = (topic: TopicSuggestion) => {
    setDraggedTopic(topic);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOverDate(dateStr);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  // Click on a date to see why it's blocked
  const handleDateClick = (date: Date) => {
    const scheduleCheck = canScheduleOnDate(date);
    
    if (!scheduleCheck.allowed) {
      toast(scheduleCheck.reason || "Deze datum is niet beschikbaar.", {
        icon: "ℹ️",
        duration: 5000,
        style: {
          maxWidth: '600px',
          padding: '16px',
          background: '#EFF6FF',
          color: '#1E40AF',
          border: '1px solid #93C5FD',
        }
      });
    }
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDate(null);
    
    const scheduleCheck = canScheduleOnDate(date);
    const currentDraggedTopic = draggedTopic; // Capture before clearing
    
    // Always clear dragged topic first
    setDraggedTopic(null);
    
    // Check if date is available
    if (!scheduleCheck.allowed) {
      // Show detailed explanation why this date is not available
      toast(scheduleCheck.reason || "Deze datum is niet beschikbaar.", {
        icon: "🚫",
        duration: 6000,
        style: {
          maxWidth: '600px',
          padding: '16px',
          background: '#FEF2F2',
          color: '#991B1B',
          border: '1px solid #FCA5A5',
        }
      });
      return;
    }
    
    // If we have a topic and date is available, open schedule dialog
    if (currentDraggedTopic) {
      setSelectedDate(date);
      setSelectedTopic(currentDraggedTopic);
      setScheduleTime(settings.preferredPostTime);
      setScheduleDialogOpen(true);
    }
  };

  // Schedule a blog
  const handleSchedule = async () => {
    if (!selectedDate || !selectedTopic) return;
    
    setIsScheduling(true);
    try {
      const scheduledFor = new Date(selectedDate);
      const [hours, minutes] = scheduleTime.split(":").map(Number);
      scheduledFor.setHours(hours, minutes, 0, 0);
      
      const response = await fetch("/api/smart-blog/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopic.id,
          topicTitle: selectedTopic.title,
          scheduledFor: scheduledFor.toISOString(),
          language: "en",
          length: "medium",
          tone: "professional",
          includeResearch: true
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule");
      }
      
      toast.success("Blog scheduled successfully!");
      setScheduleDialogOpen(false);
      setSelectedDate(null);
      setSelectedTopic(null);
      onTopicScheduled?.(selectedTopic.id);
      fetchSchedule();
      
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule blog");
    } finally {
      setIsScheduling(false);
    }
  };

  // Cancel a scheduled blog
  const handleCancelSchedule = async (blogId: string) => {
    try {
      const response = await fetch(`/api/smart-blog/schedule?id=${blogId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      
      toast.success("Schedule cancelled");
      fetchSchedule();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel schedule");
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await fetch("/api/smart-blog/schedule/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSettings)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      
      setSettings(editSettings);
      setSettingsDialogOpen(false);
      toast.success("Settings saved");
      fetchSchedule();
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      {/* Month Navigation Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={goToPreviousMonth}
                className="h-10 w-10 bg-white dark:bg-gray-900"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex flex-col items-center min-w-[200px]">
                <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {MONTHS[currentDate.getMonth()]}
                </h2>
                <span className="text-sm text-muted-foreground">{currentDate.getFullYear()}</span>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={goToNextMonth}
                className="h-10 w-10 bg-white dark:bg-gray-900"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToToday} className="ml-2">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Vandaag
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 bg-white dark:bg-gray-900">
                  <Clock className="h-3 w-3" />
                  Max {settings.maxBlogsPerWeek}/week
                </Badge>
                <Badge variant="outline" className="gap-1 bg-white dark:bg-gray-900">
                  Min {settings.minDaysBetweenPosts} dagen apart
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                setEditSettings(settings);
                setSettingsDialogOpen(true);
              }} className="bg-white dark:bg-gray-900">
                <Settings className="h-4 w-4 mr-1" />
                Instellingen
              </Button>
            </div>
          </div>
          
          {/* Quick month jumps */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
            <span className="text-xs text-muted-foreground mr-2">Snel naar:</span>
            {[0, 1, 2, 3, 4, 5].map(monthOffset => {
              const targetDate = new Date();
              targetDate.setMonth(targetDate.getMonth() + monthOffset);
              const isCurrentView = targetDate.getMonth() === currentDate.getMonth() && 
                                    targetDate.getFullYear() === currentDate.getFullYear();
              return (
                <Button
                  key={monthOffset}
                  variant={isCurrentView ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "text-xs h-7",
                    isCurrentView && "bg-purple-600 hover:bg-purple-700"
                  )}
                  onClick={() => setCurrentDate(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1))}
                >
                  {MONTHS[targetDate.getMonth()].slice(0, 3)} {targetDate.getFullYear() !== new Date().getFullYear() ? targetDate.getFullYear() : ""}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info Banner - SEO Rules Explanation */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                📊 SEO Regels voor Blog Planning
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>• <strong>Max {settings.maxBlogsPerWeek} blogs per week</strong> - Te veel content in korte tijd kan als spam worden gezien door Google</p>
                <p>• <strong>Min {settings.minDaysBetweenPosts} dagen tussen posts</strong> - Geeft zoekmachines tijd om elke blog te indexeren</p>
                <p>• <strong>Groene dagen</strong> = Aanbevolen dagen om te posten ({settings.preferredPostDays.join(", ")})</p>
                <p>• <strong>Grijze vlakken</strong> = Niet beschikbaar (verleden, te dicht bij andere blog, of week vol)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-[500px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {DAYS.map(day => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {getCalendarDays().map(({ date, isCurrentMonth }, index) => {
                      const dateStr = date.toISOString().split("T")[0];
                      const { scheduled, published } = getBlogsForDate(date);
                      const isToday = date.getTime() === today.getTime();
                      const canSchedule = isDateAvailable(date);
                      const isDragOver = dragOverDate === dateStr;
                      const isPast = date < today;
                      
                      // Check if it's a preferred day
                      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
                      const isPreferredDay = settings.preferredPostDays.includes(dayName);

                      return (
                        <div
                          key={index}
                          className={cn(
                            "min-h-[100px] p-1 border rounded-lg transition-all cursor-pointer",
                            !isCurrentMonth && "opacity-40",
                            isToday && "ring-2 ring-purple-500",
                            isPast && "bg-muted/30 cursor-not-allowed",
                            isPreferredDay && !isPast && "bg-green-50 dark:bg-green-950/20",
                            isDragOver && canSchedule && "ring-2 ring-green-500 bg-green-100 dark:bg-green-900/30",
                            isDragOver && !canSchedule && "ring-2 ring-red-500 bg-red-100 dark:bg-red-900/30",
                            !canSchedule && !isPast && scheduled.length === 0 && published.length === 0 && "bg-gray-100 dark:bg-gray-800/50"
                          )}
                          onDragOver={(e) => handleDragOver(e, dateStr)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, date)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!canSchedule && !isPast) {
                              handleDateClick(date);
                            }
                          }}
                          title={!canSchedule && !isPast ? "Klik om te zien waarom deze datum geblokkeerd is" : undefined}
                        >
                          <div className={cn(
                            "text-sm font-medium mb-1",
                            isToday && "text-purple-600 dark:text-purple-400"
                          )}>
                            {date.getDate()}
                          </div>
                          
                          {/* Published blogs */}
                          {published.map(blog => (
                            <div
                              key={blog.id}
                              className="text-xs p-1 mb-1 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 truncate flex items-center gap-1"
                              title={blog.title}
                            >
                              <Check className="h-3 w-3 shrink-0" />
                              <span className="truncate">{blog.title}</span>
                            </div>
                          ))}
                          
                          {/* Scheduled blogs */}
                          {scheduled.map(blog => (
                            <div
                              key={blog.id}
                              className={cn(
                                "text-xs p-1 mb-1 rounded truncate flex items-center gap-1 group",
                                blog.status === "SCHEDULED" && "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
                                blog.status === "PROCESSING" && "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
                                blog.status === "FAILED" && "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                              )}
                              title={blog.topicTitle}
                            >
                              {blog.status === "PROCESSING" ? (
                                <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                              ) : blog.status === "FAILED" ? (
                                <AlertCircle className="h-3 w-3 shrink-0" />
                              ) : (
                                <CalendarIcon className="h-3 w-3 shrink-0" />
                              )}
                              <span className="truncate flex-1">{blog.topicTitle}</span>
                              {blog.status === "SCHEDULED" && (
                                <button
                                  onClick={() => handleCancelSchedule(blog.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3 text-red-500 hover:text-red-700" />
                                </button>
                              )}
                            </div>
                          ))}
                          
                          {/* Empty state for droppable dates */}
                          {scheduled.length === 0 && published.length === 0 && canSchedule && !isPast && (
                            <div className="text-xs text-muted-foreground/50 text-center mt-4">
                              Sleep topic hier
                            </div>
                          )}
                          
                          {/* Show why date is blocked */}
                          {scheduled.length === 0 && published.length === 0 && !canSchedule && !isPast && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDateClick(date);
                              }}
                              className={cn(
                                "text-[10px] text-center mt-2 px-2 py-1 rounded transition-all w-full",
                                draggedTopic 
                                  ? "text-red-500 font-medium bg-red-50 dark:bg-red-950/30" 
                                  : "text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer"
                              )}
                            >
                              {draggedTopic ? "🚫 Geblokkeerd" : "🔒 Klik voor info"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Topics Sidebar */}
        <div>
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Available Topics
              </CardTitle>
              <CardDescription>
                Drag topics to the calendar to schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {topics.filter(t => t.status === "AVAILABLE" && !t.matchesExistingBlog).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No available topics</p>
                  <p className="text-xs">Generate new topics first</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {topics
                    .filter(t => t.status === "AVAILABLE" && !t.matchesExistingBlog)
                    .map(topic => (
                      <div
                        key={topic.id}
                        draggable
                        onDragStart={() => handleDragStart(topic)}
                        onDragEnd={() => setDraggedTopic(null)}
                        className={cn(
                          "p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all",
                          "hover:border-purple-300 hover:shadow-sm",
                          draggedTopic?.id === topic.id && "opacity-50 ring-2 ring-purple-500"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" title={topic.title}>
                              {topic.title}
                            </p>
                            {topic.category && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {topic.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Blog</DialogTitle>
            <DialogDescription>
              Schedule &quot;{selectedTopic?.title}&quot; for publication
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {selectedDate?.toLocaleDateString("en-US", { 
                  weekday: "long", 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Publish Time</Label>
              <Input
                id="time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={isScheduling}>
              {isScheduling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule Blog
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Settings</DialogTitle>
            <DialogDescription>
              Configure blog posting limits based on SEO best practices
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="maxBlogs">Maximum blogs per week</Label>
              <Select
                value={String(editSettings.maxBlogsPerWeek)}
                onValueChange={(v) => setEditSettings(s => ({ ...s, maxBlogsPerWeek: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} blog{n > 1 ? "s" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                SEO research suggests 2-3 blogs/week for optimal results
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minDays">Minimum days between posts</Label>
              <Select
                value={String(editSettings.minDaysBetweenPosts)}
                onValueChange={(v) => setEditSettings(s => ({ ...s, minDaysBetweenPosts: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} day{n !== 1 ? "s" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Spacing posts prevents appearing spammy to search engines
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Preferred publish time</Label>
              <Input
                id="time"
                type="time"
                value={editSettings.preferredPostTime}
                onChange={(e) => setEditSettings(s => ({ ...s, preferredPostTime: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Preferred posting days</Label>
              <div className="flex flex-wrap gap-2">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                  <Badge
                    key={day}
                    variant={editSettings.preferredPostDays.includes(day) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setEditSettings(s => ({
                        ...s,
                        preferredPostDays: s.preferredPostDays.includes(day)
                          ? s.preferredPostDays.filter(d => d !== day)
                          : [...s.preferredPostDays, day]
                      }));
                    }}
                  >
                    {day.slice(0, 3)}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Days highlighted in green on the calendar
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
              {isSavingSettings ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

