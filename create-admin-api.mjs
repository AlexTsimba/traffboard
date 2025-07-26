#!/usr/bin/env node

async function createAdminUser() {
  try {
    console.log('🔍 Creating admin user via Better Auth API...')
    
    const response = await fetch('http://localhost:3000/api/create-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@traffboard.com',
        password: 'admin123',
        name: 'Admin User'
      })
    })
    
    console.log('Response status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Admin user created successfully!')
      console.log('📧 Email: admin@traffboard.com')
      console.log('🔑 Password: admin123')
      console.log('👤 User details:', result.user)
    } else {
      const error = await response.text()
      console.error('❌ Failed to create admin user:', error)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('💡 Make sure the development server is running on http://localhost:3000')
  }
}

createAdminUser()