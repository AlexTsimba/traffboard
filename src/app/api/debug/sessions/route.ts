import { getUserSessions } from "@/lib/data/sessions";
import { requireAuth } from "@/lib/data/auth";

export async function GET() {
  try {
    console.log("Testing session API...");
    
    const user = await requireAuth();
    console.log("Auth successful for user:", user.email);
    
    const result = await getUserSessions();
    console.log("Sessions loaded:", result.sessions.length);
    
    return Response.json({ 
      success: true, 
      userEmail: user.email,
      sessionCount: result.sessions.length,
      sessions: result.sessions 
    });
  } catch (error) {
    console.error("Session test error:", error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
