"use server";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Fetch all tasks (filtered by role)
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

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToId = searchParams.get("assignedToId");
    const taskType = searchParams.get("taskType");
    const dueBefore = searchParams.get("dueBefore");
    const dueAfter = searchParams.get("dueAfter");

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Role-based filtering: Admins see all, agents see only their assigned/created tasks
    if (!isAdmin) {
      where.OR = [
        { assignedToId: userId },
        { createdById: userId },
      ];
    }

    // Apply filters
    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (priority && priority !== "all") {
      where.priority = priority;
    }

    if (assignedToId && assignedToId !== "all") {
      where.assignedToId = assignedToId === "unassigned" ? null : assignedToId;
    }

    if (taskType && taskType !== "all") {
      where.taskType = taskType;
    }

    // Date filters
    if (dueBefore || dueAfter) {
      where.dueDate = {};
      if (dueBefore) {
        where.dueDate.lte = new Date(dueBefore);
      }
      if (dueAfter) {
        where.dueDate.gte = new Date(dueAfter);
      }
    }

    const tasks = await prisma.property_task.findMany({
      where,
      orderBy: [
        { dueDate: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        // We'll need to manually fetch user info since we don't have relations defined
      },
    });

    // Fetch related user and property info
    const taskIds = tasks.map((t) => t.id);
    const userIds = [...new Set([
      ...tasks.map((t) => t.assignedToId).filter(Boolean),
      ...tasks.map((t) => t.createdById),
      ...tasks.map((t) => t.completedById).filter(Boolean),
    ])];
    const propertyIds = [...new Set(tasks.map((t) => t.propertyId).filter(Boolean))];

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

    // Enrich tasks with user and property data
    const enrichedTasks = tasks.map((task) => ({
      ...task,
      assignedTo: task.assignedToId ? usersMap.get(task.assignedToId) : null,
      createdBy: usersMap.get(task.createdById),
      completedBy: task.completedById ? usersMap.get(task.completedById) : null,
      property: task.propertyId ? propertiesMap.get(task.propertyId) : null,
    }));

    return NextResponse.json({ tasks: enrichedTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST - Create new task
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      title,
      description,
      taskType,
      propertyId,
      priority,
      dueDate,
      reminderDate,
      assignedToId,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.property_task.create({
      data: {
        title,
        description: description || null,
        taskType: taskType || "GENERAL",
        propertyId: propertyId || null,
        priority: priority || "MEDIUM",
        status: "OPEN",
        dueDate: dueDate ? new Date(dueDate) : null,
        reminderDate: reminderDate ? new Date(reminderDate) : null,
        assignedToId: assignedToId || null,
        createdById: userId,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
