import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/data/auth";
import { getCurrentUserProfile, updateUser } from "@/lib/data/users";

// Type-safe request body schema
const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
});

type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

/**
 * SECURE API Route: Get current user's profile
 * Uses Data Access Layer for all authentication and data access
 */
export async function GET() {
  try {
    // Use secure Data Access Layer (handles auth automatically)
    const user = await getCurrentUserProfile();

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * SECURE API Route: Update current user's profile
 * Uses Data Access Layer for all authentication and validation
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get current user
    const currentUser = await requireAuth();

    // Parse and validate request body with type safety
    const requestBody = (await request.json()) as unknown;
    const validationResult = updateProfileSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid input", details: validationResult.error.errors }, { status: 400 });
    }

    const { name, email }: UpdateProfileRequest = validationResult.data;

    // Use secure Data Access Layer (handles validation and auth)
    const updatedUser = await updateUser(currentUser.id, {
      name,
      email,
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);

    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Email already exists") {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
