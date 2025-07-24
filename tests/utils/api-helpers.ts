import { NextRequest } from 'next/server.js'

export async function testRequest(url: string, options: RequestInit = {}) {
  const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`
  
  // Create NextRequest compatible options
  const nextOptions: {
    method?: string
    headers?: HeadersInit
    body?: BodyInit | null
    signal?: AbortSignal
  } = {
    method: options.method,
    headers: options.headers,
    body: options.body,
  }
  
  // Only add signal if it's not null
  if (options.signal && options.signal !== null) {
    nextOptions.signal = options.signal
  }
  
  const request = new NextRequest(fullUrl, nextOptions)
  
  // Mock the handler based on the route
  if (url.startsWith('/api/auth/')) {
    try {
      const { GET, POST } = await import('~/app/api/auth/[...all]/route')
      const handler = options.method === 'POST' ? POST : GET
      return handler(request)
    } catch (error) {
      // Return proper error response for Better Auth endpoints
      return new Response(JSON.stringify({ error: 'Auth handler not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  if (url.startsWith('/api/create-admin')) {
    const { POST } = await import('~/app/api/create-admin/route')
    return POST(request)
  }
  
  if (url.startsWith('/api/test-db')) {
    const { GET } = await import('~/app/api/test-db/route')
    return GET()
  }
  
  throw new Error(`No handler found for ${url}`)
}

export function createAuthHeaders(sessionToken: string) {
  return {
    'Cookie': `better-auth.session_token=${sessionToken}`,
    'Content-Type': 'application/json'
  }
}

export async function makeAuthenticatedRequest(
  url: string, 
  sessionToken: string, 
  options: RequestInit = {}
) {
  return testRequest(url, {
    ...options,
    headers: {
      ...createAuthHeaders(sessionToken),
      ...(options.headers || {})
    }
  })
}