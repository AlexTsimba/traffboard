import { setupTestDatabase } from '../fixtures/database-helpers';

async function globalSetup() {
  console.log('Setting up test database...');
  await setupTestDatabase();
}

export default globalSetup;
