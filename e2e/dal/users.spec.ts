import { test, expect } from '@playwright/test';
import { loginAndGetAPIContext, performUIActionAndVerifyAPI } from '../fixtures/browser-api-helpers';

const TEST_USERS = {
  admin: { email: 'admin@traffboard.com', password: 'admin123' },
  user: { email: 'user@traffboard.com', password: 'user123' },
};

test.describe('DAL Users Management Tests', () => {
  test('getUsers() - API pagination and filtering', async ({ page }) => {
    const adminAPI = await loginAndGetAPIContext(page, TEST_USERS.admin);
    
    // Test basic pagination
    const response = await adminAPI.get('/api/admin/users?page=1&limit=5');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.users)).toBe(true);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(5);
    
    // Test search functionality
    const searchResponse = await adminAPI.get('/api/admin/users?search=admin');
    const searchData = await searchResponse.json();
    expect(searchData.users.some((u: any) => u.email.includes('admin'))).toBe(true);
  });

  test('createUser() - Comprehensive validation and error handling', async ({ page }) => {
    const adminAPI = await loginAndGetAPIContext(page, TEST_USERS.admin);
    
    // Test validation errors
    const invalidUser = {
      name: '',
      email: 'invalid-email',
      password: '123',
      role: 'invalid-role'
    };
    
    const validationResponse = await adminAPI.post('/api/admin/users', {
      data: JSON.stringify(invalidUser),
      headers: { 'Content-Type': 'application/json' }
    });
    expect(validationResponse.status()).toBe(400);
    
    // Test successful creation
    const validUser = {
      name: 'Test User DAL',
      email: 'testdal@example.com',
      password: 'securepass123',
      role: 'user'
    };
    
    const createResponse = await adminAPI.post('/api/admin/users', {
      data: JSON.stringify(validUser),
      headers: { 'Content-Type': 'application/json' }
    });
    expect(createResponse.status()).toBe(201);
    
    const { user: createdUser } = await createResponse.json();
    expect(createdUser.email).toBe(validUser.email);
    expect(createdUser.name).toBe(validUser.name);
    
    // Test duplicate email error
    const duplicateResponse = await adminAPI.post('/api/admin/users', {
      data: JSON.stringify(validUser),
      headers: { 'Content-Type': 'application/json' }
    });
    expect(duplicateResponse.status()).toBe(409);
    
    // Cleanup
    await adminAPI.delete(`/api/admin/users/${createdUser.id}`);
  });


  test('getUserById() - Authorization and data retrieval', async ({ page }) => {
    const adminAPI = await loginAndGetAPIContext(page, TEST_USERS.admin);
    const userAPI = await loginAndGetAPIContext(page, TEST_USERS.user);
    
    // Admin can get user list
    const usersResponse = await adminAPI.get('/api/admin/users');
    const { users } = await usersResponse.json();
    const targetUser = users[0];
    
    // Regular user cannot access admin endpoint
    const userGetResponse = await userAPI.get(`/api/admin/users/${targetUser.id}`);
    expect(userGetResponse.status()).toBe(403);
    
    // User can access own profile
    const profileResponse = await userAPI.get('/api/account/profile');
    expect(profileResponse.status()).toBe(200);
  });

  test('updateUser() - Profile updates with persistence', async ({ page }) => {
    const userAPI = await loginAndGetAPIContext(page, TEST_USERS.user);
    
    const updateData = {
      name: 'Updated Test Name',
      email: TEST_USERS.user.email
    };
    
    const updateResponse = await userAPI.patch('/api/account/profile', {
      data: JSON.stringify(updateData),
      headers: { 'Content-Type': 'application/json' }
    });
    expect(updateResponse.status()).toBe(200);
    
    // Verify update persisted
    const profileResponse = await userAPI.get('/api/account/profile');
    const profile = await profileResponse.json();
    expect(profile.user.name).toBe(updateData.name);
    
    // Reset name back
    await userAPI.patch('/api/account/profile', {
      data: JSON.stringify({ name: 'Test User', email: TEST_USERS.user.email }),
      headers: { 'Content-Type': 'application/json' }
    });
  });

  test('deleteUser() - Admin deletion with cleanup', async ({ page }) => {
    const adminAPI = await loginAndGetAPIContext(page, TEST_USERS.admin);
    
    // Create a user to delete
    const tempUser = {
      name: 'Temp Delete Test',
      email: 'tempdelete@example.com',
      password: 'temp123',
      role: 'user'
    };
    
    const createResponse = await adminAPI.post('/api/admin/users', {
      data: JSON.stringify(tempUser),
      headers: { 'Content-Type': 'application/json' }
    });
    const { user: createdUser } = await createResponse.json();
    
    // Delete the user
    const deleteResponse = await adminAPI.delete(`/api/admin/users/${createdUser.id}`);
    expect(deleteResponse.status()).toBe(200);
    
    // Verify user no longer exists
    const getResponse = await adminAPI.get(`/api/admin/users/${createdUser.id}`);
    expect(getResponse.status()).toBe(404);
  });
});
