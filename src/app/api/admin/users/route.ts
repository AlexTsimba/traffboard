import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createUser, getUsers } from "@/lib/data/users";

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "superuser"]),
});

// GET /api/admin/users - List all users with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") ?? "1");
    const limit = Number.parseInt(searchParams.get("limit") ?? "10");
    const search = searchParams.get("search") ?? "";

    const { users, totalCount } = await getUsers(page, limit, search);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);

    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ error: "Forbidden - Superuser access required" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;

    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 });
    }

    const user = await createUser(validation.data);

    return NextResponse.json({ message: "User created successfully", user }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);

    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Admin access required") {
        return NextResponse.json({ error: "Forbidden - Superuser access required" }, { status: 403 });
      }
      if (error.message === "Email already exists") {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
