const { createAuthClient } = require("better-auth/react");
const { adminClient } = require("better-auth/client/plugins");

const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [adminClient()]
});

async function debugUserData() {
  try {
    console.log("Fetching users...");
    const response = await fetch("http://localhost:3000/api/auth/admin/list-users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // You'll need to add admin session cookie here
      }
    });
    
    if (!response.ok) {
      console.error("Failed to fetch:", response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log("Raw API response:");
    console.log(JSON.stringify(data, null, 2));
    
    if (data.users && data.users.length > 0) {
      console.log("\nFirst user structure:");
      console.log(JSON.stringify(data.users[0], null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

debugUserData();