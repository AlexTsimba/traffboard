import { describe, test, expect, beforeEach } from 'vitest'
import { testRequest } from '../../utils/api-helpers'
import { testDb, clearDatabase } from '../../utils/db-helpers'

describe('Database Test API', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  test('should create test post and return success', async () => {
    const response = await testRequest('/api/test-db', {
      method: 'GET'
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    
    expect(data.message).toBe('Database connection successful! New post created:')
    expect(data.post).toBeDefined()
    expect(data.post.name).toMatch(/^Test Post \d+$/)
    expect(data.post.id).toBeDefined()
  })

  test('should verify post was actually created in database', async () => {
    // Call the API
    const response = await testRequest('/api/test-db', {
      method: 'GET'
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    const createdPostId = data.post.id

    // Verify in database
    const dbPost = await testDb.post.findUnique({
      where: { id: createdPostId }
    })

    expect(dbPost).toBeDefined()
    expect(dbPost!.name).toBe(data.post.name)
  })

  test('should create multiple posts with unique names', async () => {
    // Create first post
    const response1 = await testRequest('/api/test-db', {
      method: 'GET'
    })
    const data1 = await response1.json()

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10))

    // Create second post
    const response2 = await testRequest('/api/test-db', {
      method: 'GET'
    })
    const data2 = await response2.json()

    expect(response1.status).toBe(200)
    expect(response2.status).toBe(200)
    expect(data1.post.name).not.toBe(data2.post.name)
    expect(data1.post.id).not.toBe(data2.post.id)

    // Verify both exist in database
    const posts = await testDb.post.findMany()
    expect(posts).toHaveLength(2)
  })
})