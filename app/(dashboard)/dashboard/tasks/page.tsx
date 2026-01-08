import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TasksTable } from "@/components/shared/dashboard/tasks-table";
import { TasksCalendar } from "@/components/shared/dashboard/tasks-calendar";
import { ListTodo, Calendar } from "lucide-react";

export default function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks & Appointments</h1>
        <p className="text-muted-foreground">
          Manage all your tasks, notes and appointments in one place.
        </p>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>
                View and manage all tasks. Filter by status, priority or type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TasksTable />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                View your tasks on the calendar. Click on a day to see details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TasksCalendar />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
