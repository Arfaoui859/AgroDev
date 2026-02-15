describe("🌾 AgroGrowth Main User Flows", () => {
  beforeEach(() => {
    // Visit the application
    cy.visit("/");

    // Mock API calls to prevent external dependencies
    cy.intercept("GET", "**/api/ai/health", {
      statusCode: 200,
      body: {
        soil_analysis: "healthy",
        crop_recommendation: "healthy",
        image_diagnosis: "healthy",
        overall_status: "all_services_healthy",
      },
    }).as("aiHealth");

    cy.intercept("POST", "**/api/ai/soil/analyze", {
      statusCode: 200,
      body: {
        soil_type: {
          classification: "Sandy Loam",
          confidence: 0.85,
        },
        health_score: 78,
        fertility_level: "Good",
        overall_recommendations: [
          "Increase organic matter content",
          "Monitor pH levels regularly",
        ],
        analysis_timestamp: new Date().toISOString(),
      },
    }).as("soilAnalysis");

    cy.intercept("GET", "**/api/market/prices", {
      statusCode: 200,
      body: {
        wheat: { price: 0.45, change: 2.1, currency: "TND" },
        olive_oil: { price: 8.5, change: -1.5, currency: "TND" },
        tomatoes: { price: 1.2, change: 5.2, currency: "TND" },
      },
    }).as("marketPrices");
  });

  describe("🏠 Dashboard Flow", () => {
    it("✅ Should load dashboard and display main cards", () => {
      // Check main dashboard elements
      cy.get('[data-testid="dashboard-title"]', { timeout: 10000 }).should(
        "be.visible",
      );

      // Check for main feature cards
      cy.get('[data-testid="feature-card"]').should("have.length.at.least", 4);

      // Check if AI services status is displayed
      cy.wait("@aiHealth");
      cy.get('[data-testid="ai-status"]').should("contain.text", "healthy");
    });

    it("✅ Should navigate between tabs", () => {
      // Test tab navigation
      cy.get('[data-testid="tab-analysis"]').click();
      cy.url().should("include", "/analysis");

      cy.get('[data-testid="tab-recommendations"]').click();
      cy.url().should("include", "/recommendations");

      cy.get('[data-testid="tab-market"]').click();
      cy.url().should("include", "/market-dashboard");
    });
  });

  describe("🌱 Soil Analysis Flow", () => {
    it("✅ Should complete soil analysis workflow", () => {
      // Navigate to soil analysis
      cy.get('[data-testid="soil-analysis-card"]').click();

      // Fill soil data form
      cy.get('[data-testid="ph-input"]').type("6.5");
      cy.get('[data-testid="moisture-input"]').type("45");
      cy.get('[data-testid="nitrogen-input"]').type("85");
      cy.get('[data-testid="phosphorus-input"]').type("42");
      cy.get('[data-testid="potassium-input"]').type("118");

      // Submit analysis
      cy.get('[data-testid="analyze-soil-btn"]').click();

      // Wait for API call and check results
      cy.wait("@soilAnalysis");
      cy.get('[data-testid="soil-results"]')
        .should("be.visible")
        .and("contain.text", "Sandy Loam");

      cy.get('[data-testid="health-score"]')
        .should("be.visible")
        .and("contain.text", "78");

      cy.get('[data-testid="recommendations-list"]')
        .should("be.visible")
        .and("contain.text", "organic matter");
    });

    it("✅ Should validate soil data inputs", () => {
      cy.get('[data-testid="soil-analysis-card"]').click();

      // Try to submit without required data
      cy.get('[data-testid="analyze-soil-btn"]').click();

      // Should show validation errors
      cy.get('[data-testid="error-message"]')
        .should("be.visible")
        .and("contain.text", "required");
    });
  });

  describe("🌾 Crop Recommendations Flow", () => {
    it("✅ Should get crop recommendations", () => {
      // Navigate to recommendations
      cy.get('[data-testid="crop-recommendations-card"]').click();

      // Fill location data
      cy.get('[data-testid="latitude-input"]').type("36.8065");
      cy.get('[data-testid="longitude-input"]').type("10.1815");

      // Fill basic soil data
      cy.get('[data-testid="soil-ph-input"]').type("6.5");
      cy.get('[data-testid="soil-moisture-input"]').type("45");

      // Submit for recommendations
      cy.get('[data-testid="get-recommendations-btn"]').click();

      // Check recommendations display
      cy.get('[data-testid="crop-recommendation"]')
        .should("be.visible")
        .and("contain.text", "wheat");

      cy.get('[data-testid="suitability-score"]').should("be.visible");

      cy.get('[data-testid="profit-analysis"]').should("be.visible");
    });
  });

  describe("💰 Market Dashboard Flow", () => {
    it("✅ Should display market prices and trends", () => {
      // Navigate to market dashboard
      cy.get('[data-testid="market-dashboard-card"]').click();

      // Wait for market data to load
      cy.wait("@marketPrices");

      // Check price display
      cy.get('[data-testid="price-wheat"]')
        .should("be.visible")
        .and("contain.text", "0.45");

      cy.get('[data-testid="price-change"]').should("be.visible");

      // Check currency display
      cy.get('[data-testid="currency"]').should("contain.text", "TND");
    });

    it("✅ Should filter market data by category", () => {
      cy.get('[data-testid="market-dashboard-card"]').click();
      cy.wait("@marketPrices");

      // Test category filters
      cy.get('[data-testid="filter-cereals"]').click();
      cy.get('[data-testid="wheat-row"]').should("be.visible");

      cy.get('[data-testid="filter-vegetables"]').click();
      cy.get('[data-testid="tomatoes-row"]').should("be.visible");
    });
  });

  describe("🎮 Gamification Flow", () => {
    it("✅ Should display user progress and achievements", () => {
      // Navigate to gamification dashboard
      cy.get('[data-testid="gamification-card"]').click();

      // Check user profile display
      cy.get('[data-testid="user-level"]').should("be.visible");

      cy.get('[data-testid="xp-progress"]').should("be.visible");

      // Check achievements tab
      cy.get('[data-testid="achievements-tab"]').click();
      cy.get('[data-testid="achievement-badge"]').should(
        "have.length.at.least",
        1,
      );

      // Check leaderboard tab
      cy.get('[data-testid="leaderboard-tab"]').click();
      cy.get('[data-testid="leaderboard-entry"]').should(
        "have.length.at.least",
        1,
      );
    });
  });

  describe("📱 Offline Mode Flow", () => {
    it("✅ Should work in offline mode", () => {
      // Navigate to offline manager
      cy.get('[data-testid="offline-manager-card"]').click();

      // Check offline status
      cy.get('[data-testid="offline-status"]').should("be.visible");

      // Enable offline mode
      cy.get('[data-testid="enable-offline-btn"]').click();

      // Simulate offline
      cy.window().then((win) => {
        cy.stub(win.navigator, "onLine").value(false);
        cy.window().trigger("offline");
      });

      // Check that app still functions
      cy.get('[data-testid="offline-indicator"]')
        .should("be.visible")
        .and("contain.text", "offline");

      // Navigate to cached page
      cy.get('[data-testid="soil-analysis-card"]').click();
      cy.get('[data-testid="offline-notice"]').should("be.visible");
    });
  });

  describe("🔐 Authentication Flow", () => {
    it("✅ Should handle user authentication", () => {
      // Navigate to login if not authenticated
      cy.window().then((win) => {
        win.localStorage.removeItem("authToken");
      });

      cy.visit("/login");

      // Fill login form
      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");

      // Submit login
      cy.get('[data-testid="login-btn"]').click();

      // Should redirect to dashboard
      cy.url().should("include", "/");
      cy.get('[data-testid="user-menu"]').should("be.visible");
    });
  });

  describe("🌐 Responsive Design", () => {
    it("✅ Should work on mobile devices", () => {
      cy.viewport("iphone-x");

      // Check mobile navigation
      cy.get('[data-testid="mobile-menu-trigger"]').click();
      cy.get('[data-testid="mobile-nav"]').should("be.visible");

      // Check responsive cards
      cy.get('[data-testid="feature-card"]')
        .should("be.visible")
        .and("have.css", "width");
    });

    it("✅ Should work on tablet devices", () => {
      cy.viewport("ipad-2");

      // Check tablet layout
      cy.get('[data-testid="dashboard-grid"]').should("be.visible");

      cy.get('[data-testid="feature-card"]').should("have.length.at.least", 4);
    });
  });
});
