import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const allSessions = await prisma.session.findMany({
      include: {
        user: {
          select: { email: true }
        }
      }
    });
    
    return Response.json({ 
      totalSessions: allSessions.length,
      sessions: allSessions.map(s => ({
        sessionToken: s.sessionToken.slice(0, 8) + "...",
        userId: s.userId,
        userEmail: s.user.email,
        expires: s.expires,
        isActive: s.isActive,
        lastActivity: s.lastActivity
      }))
    });
  } catch (error) {
    return Response.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
