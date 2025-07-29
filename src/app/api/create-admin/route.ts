import { type NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    
    // Use Better Auth server-side API directly (correct method)
    const userResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name
      }
    });

    console.log("User creation result:", userResult);

    if (!userResult?.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 400 }
      );
    }

    // Update user role to admin using Prisma (Better Auth pattern)
    const adminUser = await prisma.user.update({
      where: { id: userResult.user.id },
      data: { 
        role: 'admin',
        emailVerified: true 
      }
    });

    return NextResponse.json({
      message: "Admin user created successfully",
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
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