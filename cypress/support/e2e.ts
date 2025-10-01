// Import commands
import "./commands";

// Cypress global configuration
Cypress.on("uncaught:exception", (err, runnable) => {
  // Ignore external script errors (FullStory, etc.)
  if (
    err.message.includes("fullstory") ||
    err.message.includes("Script error") ||
    err.message.includes("Non-Error promise rejection")
  ) {
    return false;
  }
  return true;
});

// Add custom commands for authentication
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/login`,
    body: { email, password },
  }).then((response) => {
    window.localStorage.setItem("authToken", response.body.token);
  });
});

Cypress.Commands.add("logout", () => {
  window.localStorage.removeItem("authToken");
});

// Add custom commands for API mocking
Cypress.Commands.add("mockApiCalls", () => {
  cy.intercept("GET", "**/api/ai/health", { fixture: "ai-health.json" });
  cy.intercept("GET", "**/api/market/prices", {
    fixture: "market-prices.json",
  });
  cy.intercept("POST", "**/api/ai/soil/analyze", {
    fixture: "soil-analysis.json",
  });
});

// Add accessibility testing
import "cypress-axe";

Cypress.Commands.add("checkA11y", () => {
  cy.injectAxe();
  cy.checkA11y(undefined, {
    includedImpacts: ["critical", "serious"],
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      mockApiCalls(): Chainable<void>;
      checkA11y(): Chainable<void>;
    }
  }
}
