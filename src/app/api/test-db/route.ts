import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const newPost = await prisma.post.create({
      data: {
        name: `Test Post ${Date.now()}`,
      },
    });
    return NextResponse.json({ message: "Database connection successful! New post created:", post: newPost });
  } catch (error: unknown) {
    console.error("Database connection error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Database connection failed!", error: errorMessage }, { status: 500 });
  }
}
