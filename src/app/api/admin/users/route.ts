import bcryptjs from "bcryptjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { auth } from "../../../../../auth";

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "superuser"]),
});

// Helper function to check if user is superuser
async function requireSuperuser() {
  const session = await auth();

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (session.user.role !== "superuser") {
    return { error: NextResponse.json({ error: "Forbidden - Superuser access required" }, { status: 403 }) };
  }

  return { session };
}

// GET /api/admin/users - List all users with pagination
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperuser();
    if ("error" in authResult) return authResult.error;

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") ?? "1");
    const limit = Number.parseInt(searchParams.get("limit") ?? "10");
    const search = searchParams.get("search") ?? "";
    const role = searchParams.get("role") ?? "";

    const skip = (page - 1) * limit;

    // Build filter conditions
    interface WhereCondition {
      OR?: { name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" } }[];
      role?: string;
    }

    const where: WhereCondition = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && ["user", "superuser"].includes(role)) {
      where.role = role;
    }

    // Get users with creator info
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          createdByUser: {
            select: {
              name: true,
              email: true,
            },
          },
          lastModifiedByUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperuser();
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;
    const body = (await request.json()) as unknown;

    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 });
    }

    const { name, email, password, role } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        createdBy: session.user.id,
        lastModifiedBy: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        createdByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ message: "User created successfully", user }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
