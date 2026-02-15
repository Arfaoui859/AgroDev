import { config } from "dotenv";

// Load test environment variables
config({ path: ".env.test" });

// Global test setup
beforeAll(async () => {
  // Setup test database or mock services if needed
  console.log("🧪 Test environment setup complete");
});

afterAll(async () => {
  // Cleanup after all tests
  console.log("🧹 Test environment cleanup complete");
});

// Increase timeout for integration tests
jest.setTimeout(30000);
