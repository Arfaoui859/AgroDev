// Custom commands for AgroGrowth testing

// Command to fill soil analysis form
Cypress.Commands.add(
  "fillSoilAnalysisForm",
  (data: {
    ph: number;
    moisture: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  }) => {
    cy.get('[data-testid="ph-input"]').clear().type(data.ph.toString());
    cy.get('[data-testid="moisture-input"]')
      .clear()
      .type(data.moisture.toString());
    cy.get('[data-testid="nitrogen-input"]')
      .clear()
      .type(data.nitrogen.toString());
    cy.get('[data-testid="phosphorus-input"]')
      .clear()
      .type(data.phosphorus.toString());
    cy.get('[data-testid="potassium-input"]')
      .clear()
      .type(data.potassium.toString());
  },
);

// Command to check soil analysis results
Cypress.Commands.add(
  "verifySoilResults",
  (expectedResults: {
    soilType?: string;
    healthScore?: number;
    fertilityLevel?: string;
  }) => {
    if (expectedResults.soilType) {
      cy.get('[data-testid="soil-type"]').should(
        "contain.text",
        expectedResults.soilType,
      );
    }
    if (expectedResults.healthScore) {
      cy.get('[data-testid="health-score"]').should(
        "contain.text",
        expectedResults.healthScore.toString(),
      );
    }
    if (expectedResults.fertilityLevel) {
      cy.get('[data-testid="fertility-level"]').should(
        "contain.text",
        expectedResults.fertilityLevel,
      );
    }
  },
);

// Command to navigate to specific dashboard section
Cypress.Commands.add("navigateToSection", (section: string) => {
  const sectionMap: Record<string, string> = {
    "soil-analysis": '[data-testid="soil-analysis-card"]',
    "crop-recommendations": '[data-testid="crop-recommendations-card"]',
    "market-dashboard": '[data-testid="market-dashboard-card"]',
    gamification: '[data-testid="gamification-card"]',
    "offline-manager": '[data-testid="offline-manager-card"]',
  };

  const selector = sectionMap[section];
  if (selector) {
    cy.get(selector).click();
  } else {
    throw new Error(`Unknown section: ${section}`);
  }
});

// Command to wait for loading to complete
Cypress.Commands.add("waitForLoad", () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should(
    "not.exist",
  );
  cy.get('[data-testid="error-message"]').should("not.exist");
});

// Command to check responsive layout
Cypress.Commands.add("checkResponsiveLayout", () => {
  // Desktop
  cy.viewport(1280, 720);
  cy.get('[data-testid="dashboard-grid"]').should("be.visible");

  // Tablet
  cy.viewport(768, 1024);
  cy.get('[data-testid="feature-card"]').should("be.visible");

  // Mobile
  cy.viewport(375, 667);
  cy.get('[data-testid="mobile-menu-trigger"]').should("be.visible");
});

// Command to simulate offline mode
Cypress.Commands.add("simulateOffline", () => {
  cy.window().then((win) => {
    cy.stub(win.navigator, "onLine").value(false);
    cy.window().trigger("offline");
  });
});

// Command to simulate online mode
Cypress.Commands.add("simulateOnline", () => {
  cy.window().then((win) => {
    cy.stub(win.navigator, "onLine").value(true);
    cy.window().trigger("online");
  });
});

// Extend Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      fillSoilAnalysisForm(data: {
        ph: number;
        moisture: number;
        nitrogen: number;
        phosphorus: number;
        potassium: number;
      }): Chainable<void>;

      verifySoilResults(expectedResults: {
        soilType?: string;
        healthScore?: number;
        fertilityLevel?: string;
      }): Chainable<void>;

      navigateToSection(section: string): Chainable<void>;
      waitForLoad(): Chainable<void>;
      checkResponsiveLayout(): Chainable<void>;
      simulateOffline(): Chainable<void>;
      simulateOnline(): Chainable<void>;
    }
  }
}

export {};
