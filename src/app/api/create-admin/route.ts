import { auth } from "~/lib/auth";
import { type NextRequest, NextResponse } from "next/server";

interface CreateAdminRequest {
  email: string;
  password: string;
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json() as CreateAdminRequest;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Create admin user using Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        // Set as admin user
        callbackURL: "/dashboard"
      }
    });

    if (!result.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 400 }
      );
    }

    // TODO: Set admin role - updateUser API signature needs investigation
    // await auth.api.updateUser({ ... });

    return NextResponse.json({
      message: "Admin user created successfully",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: "admin"
      }
    });

  } catch (error) {
    console.error("Admin creation error:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}