import { auth } from "~/lib/auth";
import { db } from "~/server/db";
import { type NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if any admin users exist
    const existingAdmins = await db.user.findMany({
      where: { role: 'admin' }
    });

    return NextResponse.json({
      hasAdminUsers: existingAdmins.length > 0,
      adminCount: existingAdmins.length
    });
  } catch (error) {
    console.error('Setup status check error:', error);
    return NextResponse.json(
      { error: "Failed to check setup status" }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if any admin users exist
    const existingAdmins = await db.user.findMany({
      where: { role: 'admin' }
    });

    if (existingAdmins.length > 0) {
      return NextResponse.json(
        { error: "Admin users already exist" }, 
        { status: 400 }
      );
    }

    const body = await request.json() as { name?: string; email?: string; password?: string };
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }

    try {
      // Use Better Auth server API for user creation
      const result = await auth.api.signUpEmail({
        body: { 
          email: email.trim(), 
          password, 
          name: name.trim() 
        }
      });

      if (result.user) {
        // Update to admin role and verify email
        await db.user.update({
          where: { id: result.user.id },
          data: { 
            role: 'admin', 
            emailVerified: true 
          }
        });

        return NextResponse.json({ 
          success: true, 
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: 'admin'
          }
        });
      } else {
        return NextResponse.json(
          { error: "Failed to create user - no user returned" }, 
          { status: 500 }
        );
      }
    } catch (signUpError) {
      // Handle signup errors (like duplicate email)
      const errorMessage = signUpError instanceof Error ? signUpError.message : 'Failed to create user';
      return NextResponse.json(
        { error: errorMessage }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Setup API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" }, 
      { status: 500 }
    );
  }
}