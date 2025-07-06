import { teardownTestDatabase } from "../fixtures/database-helpers";

async function globalTeardown() {
  console.log("Cleaning up test database...");
  await teardownTestDatabase();
}

export default globalTeardown;
