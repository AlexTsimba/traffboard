import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";

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

    console.log("Creating admin user with Better Auth server-side API...");
    
    // Use Better Auth server-side API directly
    const userResult = await auth.api.createUser({
      body: {
        email,
        password,
        name,
        role: "admin"
      }
    });

    console.log("User creation result:", userResult);

    if (!userResult?.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Admin user created successfully",
      user: {
        id: userResult.user.id,
        email: userResult.user.email,
        name: userResult.user.name,
        role: userResult.user.role
      }
    });

  } catch (error) {
    console.error("Admin creation error:", error);
    
    // Handle specific Better Auth errors
    if (error instanceof Error) {
      if (error.message.includes("already exists") || error.message.includes("duplicate")) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create admin user", details: errorMessage },
      { status: 500 }
    );
  }
}