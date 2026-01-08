"use server";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Fetch tasks due today + overdue (for notifications)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = (session.user as { role?: string }).role;
    const isAdmin = userRole === "ADMIN";

    // Get today's date range (start and end of day)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    // Tomorrow for "due tomorrow" items
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));
    
    // Next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Build base where clause for access control
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseWhere: any = {
      status: { in: ["OPEN", "IN_PROGRESS"] },
    };

    if (!isAdmin) {
      baseWhere.OR = [
        { assignedToId: userId },
        { createdById: userId },
      ];
    }

    // Fetch overdue tasks
    const overdueTasks = await prisma.property_task.findMany({
      where: {
        ...baseWhere,
        dueDate: { lt: startOfDay },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    });

    // Fetch tasks due today
    const todayTasks = await prisma.property_task.findMany({
      where: {
        ...baseWhere,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    });

    // Fetch tasks due tomorrow
    const tomorrowTasks = await prisma.property_task.findMany({
      where: {
        ...baseWhere,
        dueDate: {
          gte: startOfTomorrow,
          lte: endOfTomorrow,
        },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    });

    // Fetch tasks due this week (excluding today and tomorrow)
    const weekTasks = await prisma.property_task.findMany({
      where: {
        ...baseWhere,
        dueDate: {
          gt: endOfTomorrow,
          lte: nextWeek,
        },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    });

    // Get all unique IDs for enrichment
    const allTasks = [...overdueTasks, ...todayTasks, ...tomorrowTasks, ...weekTasks];
    const userIds = [...new Set([
      ...allTasks.map((t) => t.assignedToId).filter(Boolean),
      ...allTasks.map((t) => t.createdById),
    ])];
    const propertyIds = [...new Set(allTasks.map((t) => t.propertyId).filter(Boolean))];

    // Fetch users
    const users = await prisma.user.findMany({
      where: { id: { in: userIds as string[] } },
      select: { id: true, name: true, email: true, image: true },
    });
    const usersMap = new Map(users.map((u) => [u.id, u]));

    // Fetch properties
    const properties = propertyIds.length > 0
      ? await prisma.property.findMany({
          where: { id: { in: propertyIds as string[] } },
          select: { id: true, title: true, listingNumber: true, image: true, slug: true, provinceSlug: true, areaSlug: true },
        })
      : [];
    const propertiesMap = new Map(properties.map((p) => [p.id, p]));

    // Enrich function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichTask = (task: any) => ({
      ...task,
      assignedTo: task.assignedToId ? usersMap.get(task.assignedToId) : null,
      createdBy: usersMap.get(task.createdById),
      property: task.propertyId ? propertiesMap.get(task.propertyId) : null,
    });

    return NextResponse.json({
      overdue: overdueTasks.map(enrichTask),
      today: todayTasks.map(enrichTask),
      tomorrow: tomorrowTasks.map(enrichTask),
      thisWeek: weekTasks.map(enrichTask),
      counts: {
        overdue: overdueTasks.length,
        today: todayTasks.length,
        tomorrow: tomorrowTasks.length,
        thisWeek: weekTasks.length,
        total: overdueTasks.length + todayTasks.length,
      },
    });
  } catch (error) {
    console.error("Error fetching due tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch due tasks" },
      { status: 500 }
    );
  }
}
