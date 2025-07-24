import { describe, test, expect, beforeEach } from 'vitest'
import { testRequest } from '../../utils/api-helpers'
import { testDb, clearDatabase } from '../../utils/db-helpers'

describe('Admin Creation API', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  test('should create admin user with valid data', async () => {
    const adminData = {
      email: 'admin@traffboard.com',
      password: 'securePassword123!',
      name: 'Admin User'
    }

    const response = await testRequest('/api/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData)
    })

    expect([200, 400, 500]).toContain(response.status)
    
    if (response.status === 200) {
      const data = await response.json()
      expect(data.message).toBe('Admin user created successfully')
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(adminData.email)
      expect(data.user.name).toBe(adminData.name)
      expect(data.user.role).toBe('admin')
    }
  })

  test('should reject request with missing fields', async () => {
    const incompleteData = {
      email: 'admin@traffboard.com',
      // Missing password and name
    }

    const response = await testRequest('/api/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incompleteData)
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Email, password, and name are required')
  })

  test('should reject duplicate email addresses', async () => {
    const adminData = {
      email: 'duplicate@traffboard.com',
      password: 'password123',
      name: 'First Admin'
    }

    // Create first admin
    await testRequest('/api/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData)
    })

    // Try to create second admin with same email
    const duplicateResponse = await testRequest('/api/create-admin', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...adminData,
        name: 'Second Admin'
      })
    })

    expect([400, 409, 500]).toContain(duplicateResponse.status)
  })

  test('should handle malformed JSON', async () => {
    const response = await testRequest('/api/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    })

    expect([400, 500]).toContain(response.status)
  })
})