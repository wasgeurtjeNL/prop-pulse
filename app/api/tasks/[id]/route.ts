"use server";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Fetch single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const userRole = (session.user as { role?: string }).role;
    const isAdmin = userRole === "ADMIN";

    const task = await prisma.property_task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check access rights
    if (!isAdmin && task.assignedToId !== userId && task.createdById !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch related data
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: [task.assignedToId, task.createdById, task.completedById].filter(
            Boolean
          ) as string[],
        },
      },
      select: { id: true, name: true, email: true, image: true },
    });
    const usersMap = new Map(users.map((u) => [u.id, u]));

    const property = task.propertyId
      ? await prisma.property.findUnique({
          where: { id: task.propertyId },
          select: { id: true, title: true, listingNumber: true, image: true, slug: true, provinceSlug: true, areaSlug: true },
        })
      : null;

    const enrichedTask = {
      ...task,
      assignedTo: task.assignedToId ? usersMap.get(task.assignedToId) : null,
      createdBy: usersMap.get(task.createdById),
      completedBy: task.completedById ? usersMap.get(task.completedById) : null,
      property,
    };

    return NextResponse.json({ task: enrichedTask });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const userRole = (session.user as { role?: string }).role;
    const isAdmin = userRole === "ADMIN";

    const existingTask = await prisma.property_task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check access rights
    if (!isAdmin && existingTask.assignedToId !== userId && existingTask.createdById !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      taskType,
      propertyId,
      priority,
      status,
      dueDate,
      reminderDate,
      assignedToId,
    } = body;

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (taskType !== undefined) updateData.taskType = taskType;
    if (propertyId !== undefined) updateData.propertyId = propertyId || null;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (reminderDate !== undefined) updateData.reminderDate = reminderDate ? new Date(reminderDate) : null;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;

    // Handle status changes
    if (status !== undefined) {
      updateData.status = status;
      
      // If completed, record who and when
      if (status === "COMPLETED" && existingTask.status !== "COMPLETED") {
        updateData.completedAt = new Date();
        updateData.completedById = userId;
      }
      
      // If reopening, clear completion data
      if (status !== "COMPLETED" && existingTask.status === "COMPLETED") {
        updateData.completedAt = null;
        updateData.completedById = null;
      }
    }

    const task = await prisma.property_task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const userRole = (session.user as { role?: string }).role;
    const isAdmin = userRole === "ADMIN";

    const existingTask = await prisma.property_task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check access rights - only admin or creator can delete
    if (!isAdmin && existingTask.createdById !== userId) {
      return NextResponse.json({ error: "Unauthorized - only creator or admin can delete" }, { status: 403 });
    }

    await prisma.property_task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
