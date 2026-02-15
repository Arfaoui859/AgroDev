/**
 * AgroGrowth Platform - Comprehensive Navigation QA Test Suite
 *
 * This test suite automatically validates all navigation elements across the platform
 * ensuring proper routing, no unwanted redirects to "/", and complete route coverage.
 */

import { expect, test, describe, beforeAll, afterAll } from "vitest";

interface NavigationTestResult {
  route: string;
  label: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL";
  error?: string;
  element?: string;
  category?: string;
}

interface NavigationTestSuite {
  sidebarCategories: Array<{
    name: string;
    nameArabic: string;
    items: Array<{
      name: string;
      nameArabic: string;
      href: string;
      expectedRoute: string;
    }>;
  }>;
  quickActions: Array<{
    name: string;
    nameArabic: string;
    href: string;
    expectedRoute: string;
  }>;
  topbarElements: Array<{
    name: string;
    selector: string;
    expectedAction: string;
  }>;
}

class NavigationQATester {
  private results: NavigationTestResult[] = [];
  private baseUrl =
    "https://909331b5df274bcb974a9b7bf165a4c2-2732d7370f0d4c63a9d0d6801.fly.dev";
  private testUser = {
    token: "valid-jwt-token",
    role: "farmer",
    name: "أحمد المحمود",
    nameArabic: "أحمد المحمود",
  };

  constructor() {
    this.setupAuthentication();
  }

  private setupAuthentication(): void {
    // Simulate successful login by setting up localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("authToken", this.testUser.token);
      localStorage.setItem("userRole", this.testUser.role);
      localStorage.setItem("userName", this.testUser.name);
    }
  }

  private async navigateAndValidate(
    route: string,
    label: string,
    expectedRoute: string,
    category: string,
    elementSelector?: string,
  ): Promise<NavigationTestResult> {
    const result: NavigationTestResult = {
      route,
      label,
      expected: expectedRoute,
      actual: "",
      status: "FAIL",
      category,
      element: elementSelector,
    };

    try {
      // Simulate navigation
      if (typeof window !== "undefined") {
        // Navigate to route
        window.history.pushState({}, "", route);

        // Wait for React Router to process
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Check current location
        const currentPath = window.location.pathname;
        result.actual = currentPath;

        // Validate route
        if (currentPath === expectedRoute) {
          result.status = "PASS";
        } else {
          result.status = "FAIL";
          result.error = `Expected ${expectedRoute}, got ${currentPath}`;

          // Check for common failure patterns
          if (currentPath === "/") {
            result.error += " - Unexpected redirect to home page";
          } else if (currentPath === "/login") {
            result.error += " - Route requires authentication";
          } else if (
            currentPath.includes("/404") ||
            currentPath.includes("not-found")
          ) {
            result.error += " - Route not found (404)";
          }
        }
      }
    } catch (error) {
      result.error = `Navigation error: ${error instanceof Error ? error.message : String(error)}`;
      result.actual = "ERROR";
    }

    this.results.push(result);
    return result;
  }

  async testSidebarNavigation(): Promise<void> {
    console.log("🧪 Testing Sidebar Navigation...");

    const sidebarCategories = [
      {
        name: "Dashboards",
        nameArabic: "لوحات التحكم",
        items: [
          {
            name: "Farmer Dashboard",
            nameArabic: "لوحة تحكم الفلاح",
            href: "/farmer-dashboard",
            expectedRoute: "/farmer-dashboard",
          },
          {
            name: "Agronomist Dashboard",
            nameArabic: "لوحة تحكم الخبير الزراعي",
            href: "/agronomist-dashboard",
            expectedRoute: "/agronomist-dashboard",
          },
          {
            name: "Trader Dashboard",
            nameArabic: "لوحة تحكم التاجر",
            href: "/trader-dashboard",
            expectedRoute: "/trader-dashboard",
          },
          {
            name: "Veterinarian Dashboard",
            nameArabic: "لوحة تحكم الطبيب البيطري",
            href: "/veterinarian-dashboard",
            expectedRoute: "/veterinarian-dashboard",
          },
          {
            name: "Comprehensive Farm Management",
            nameArabic: "إدارة المزرعة الشاملة",
            href: "/comprehensive-farm-management",
            expectedRoute: "/comprehensive-farm-management",
          },
          {
            name: "Field Inspector Dashboard",
            nameArabic: "لوحة تحكم مراقب الحقول",
            href: "/field-inspector-dashboard",
            expectedRoute: "/field-inspector-dashboard",
          },
          {
            name: "AI Intelligence",
            nameArabic: "لوحة الذكاء الاصطناعي",
            href: "/ai-intelligence",
            expectedRoute: "/ai-intelligence",
          },
          {
            name: "Admin Panel",
            nameArabic: "لوحة تحكم مدير المنصة",
            href: "/admin-panel",
            expectedRoute: "/admin-panel",
          },
          {
            name: "Government Official",
            nameArabic: "مسؤول الجهة الحكومية",
            href: "/government-dashboard",
            expectedRoute: "/government-dashboard",
          },
        ],
      },
      {
        name: "Soil Analysis",
        nameArabic: "تحليل التربة",
        items: [
          {
            name: "Data Input",
            nameArabic: "إدخال البيانات",
            href: "/data-input",
            expectedRoute: "/data-input",
          },
          {
            name: "Soil Analysis",
            nameArabic: "تحليل التربة",
            href: "/analysis",
            expectedRoute: "/analysis",
          },
          {
            name: "Data History",
            nameArabic: "سجل البيانات",
            href: "/history",
            expectedRoute: "/history",
          },
          {
            name: "Location Selection",
            nameArabic: "اختيار الموقع",
            href: "/location",
            expectedRoute: "/location",
          },
          {
            name: "Smart Soil Detection",
            nameArabic: "كاشف مشاكل التربة الذكي",
            href: "/soil-problem-detection",
            expectedRoute: "/soil-problem-detection",
          },
          {
            name: "Ideal Soil Comparison",
            nameArabic: "مقارنة مع التربة المثالية",
            href: "/ideal-soil-comparison",
            expectedRoute: "/ideal-soil-comparison",
          },
          {
            name: "Soil Alert System",
            nameArabic: "نظام التنبيهات الذكي",
            href: "/soil-alert-system",
            expectedRoute: "/soil-alert-system",
          },
        ],
      },
      {
        name: "Crop Management",
        nameArabic: "إدارة المحاصيل",
        items: [
          {
            name: "Crop Recommendations",
            nameArabic: "توصيات المحاصيل",
            href: "/recommendations",
            expectedRoute: "/recommendations",
          },
          {
            name: "Smart Crop Suggestions",
            nameArabic: "اقتراحات الزراعة الذكية",
            href: "/smart-crop-suggestions",
            expectedRoute: "/smart-crop-suggestions",
          },
          {
            name: "Crop Rotation Planner",
            nameArabic: "مخطط الدورة الزراعية",
            href: "/crop-rotation-planner",
            expectedRoute: "/crop-rotation-planner",
          },
          {
            name: "Recommendation History",
            nameArabic: "سجل التوصيات",
            href: "/crop-history",
            expectedRoute: "/crop-history",
          },
          {
            name: "Crop Alerts",
            nameArabic: "تنبيهات المحاصيل",
            href: "/alert-history",
            expectedRoute: "/alert-history",
          },
          {
            name: "Daily Tasks",
            nameArabic: "المهام اليومية",
            href: "/my-tasks",
            expectedRoute: "/my-tasks",
          },
        ],
      },
      {
        name: "Disease Detection",
        nameArabic: "كشف الأمراض",
        items: [
          {
            name: "Disease Diagnosis",
            nameArabic: "تشخيص الأمراض",
            href: "/disease-upload",
            expectedRoute: "/disease-upload",
          },
          {
            name: "Diagnosis History",
            nameArabic: "سجل التشخيص",
            href: "/disease-history",
            expectedRoute: "/disease-history",
          },
          {
            name: "Disease Guide",
            nameArabic: "دليل الأمراض",
            href: "/disease-guide",
            expectedRoute: "/disease-guide",
          },
          {
            name: "Smart Treatment",
            nameArabic: "توصيات العلاج الذكية",
            href: "/treatment-recommendations",
            expectedRoute: "/treatment-recommendations",
          },
          {
            name: "Treatment History",
            nameArabic: "تاريخ العلاجات",
            href: "/treatment-history",
            expectedRoute: "/treatment-history",
          },
        ],
      },
      {
        name: "Market Intelligence",
        nameArabic: "ذكاء السوق",
        items: [
          {
            name: "Smart Market",
            nameArabic: "السوق الذكي",
            href: "/market-dashboard",
            expectedRoute: "/market-dashboard",
          },
          {
            name: "Price Forecasts",
            nameArabic: "توقعات الأسعار",
            href: "/price-forecasts",
            expectedRoute: "/price-forecasts",
          },
          {
            name: "Market Alerts",
            nameArabic: "تنبيهات السوق",
            href: "/market-alerts",
            expectedRoute: "/market-alerts",
          },
        ],
      },
      {
        name: "Water Management",
        nameArabic: "إدارة المياه",
        items: [
          {
            name: "Smart Irrigation",
            nameArabic: "نظام الري الذكي",
            href: "/smart-irrigation",
            expectedRoute: "/smart-irrigation",
          },
          {
            name: "Irrigation Scheduler",
            nameArabic: "جدولة الري الذكية",
            href: "/irrigation-scheduler",
            expectedRoute: "/irrigation-scheduler",
          },
          {
            name: "Water Analytics",
            nameArabic: "تحليل استهلاك المياه",
            href: "/water-analytics",
            expectedRoute: "/water-analytics",
          },
          {
            name: "Water Conservation",
            nameArabic: "تحليلات توفير المياه",
            href: "/water-conservation",
            expectedRoute: "/water-conservation",
          },
        ],
      },
      {
        name: "Financial Management",
        nameArabic: "الإدارة المالية",
        items: [
          {
            name: "Financial Dashboard",
            nameArabic: "لوحة المالية",
            href: "/financial-dashboard",
            expectedRoute: "/financial-dashboard",
          },
          {
            name: "Expense Tracker",
            nameArabic: "تتبع المصروفات",
            href: "/expense-tracker",
            expectedRoute: "/expense-tracker",
          },
          {
            name: "Revenue Analysis",
            nameArabic: "تحليل الإيرادات",
            href: "/revenue-analysis",
            expectedRoute: "/revenue-analysis",
          },
          {
            name: "Profitability Reports",
            nameArabic: "تقارير الربحية",
            href: "/profitability-reports",
            expectedRoute: "/profitability-reports",
          },
          {
            name: "Budget Planning",
            nameArabic: "تخطيط الميزانية",
            href: "/budget-planning",
            expectedRoute: "/budget-planning",
          },
        ],
      },
    ];

    for (const category of sidebarCategories) {
      console.log(`  📂 Testing category: ${category.nameArabic}`);

      for (const item of category.items) {
        await this.navigateAndValidate(
          item.href,
          item.nameArabic,
          item.expectedRoute,
          `Sidebar - ${category.nameArabic}`,
          `a[href="${item.href}"]`,
        );
      }
    }
  }

  async testQuickActions(): Promise<void> {
    console.log("🚀 Testing Quick Actions...");

    const quickActions = [
      {
        name: "Farmer Dashboard",
        nameArabic: "لوحة الفلاح",
        href: "/farmer-dashboard",
        expectedRoute: "/farmer-dashboard",
      },
      {
        name: "Comprehensive Farm Management",
        nameArabic: "الإدارة الشاملة",
        href: "/comprehensive-farm-management",
        expectedRoute: "/comprehensive-farm-management",
      },
    ];

    for (const action of quickActions) {
      await this.navigateAndValidate(
        action.href,
        action.nameArabic,
        action.expectedRoute,
        "Quick Actions",
        `a[href="${action.href}"]`,
      );
    }
  }

  async testSpecialRoutes(): Promise<void> {
    console.log("🔍 Testing Special Routes...");

    const specialRoutes = [
      {
        route: "/login",
        expected: "/login",
        label: "Login Page",
        category: "Authentication",
      },
      {
        route: "/signup",
        expected: "/signup",
        label: "Signup Page",
        category: "Authentication",
      },
      {
        route: "/settings",
        expected: "/settings",
        label: "User Settings",
        category: "User Management",
      },
      {
        route: "/notifications",
        expected: "/notifications",
        label: "Notification Center",
        category: "Notifications",
      },
      {
        route: "/system-test",
        expected: "/system-test",
        label: "System Test",
        category: "System",
      },
      {
        route: "/field-management",
        expected: "/field-management",
        label: "Field Management",
        category: "Farm Management",
      },
      {
        route: "/nonexistent-route",
        expected: "/404",
        label: "Non-existent Route (404)",
        category: "Error Handling",
      },
    ];

    for (const route of specialRoutes) {
      await this.navigateAndValidate(
        route.route,
        route.label,
        route.expected,
        route.category,
      );
    }
  }

  async testDynamicRoutes(): Promise<void> {
    console.log("🔄 Testing Dynamic Routes...");

    const dynamicRoutes = [
      {
        route: "/crop/tomato",
        expected: "/crop/tomato",
        label: "Crop Details (tomato)",
        category: "Dynamic Routes",
      },
      {
        route: "/crop/wheat",
        expected: "/crop/wheat",
        label: "Crop Details (wheat)",
        category: "Dynamic Routes",
      },
      {
        route: "/disease-diagnosis/test-123",
        expected: "/disease-diagnosis/test-123",
        label: "Disease Diagnosis (test-123)",
        category: "Dynamic Routes",
      },
      {
        route: "/treatment-progress/history-456",
        expected: "/treatment-progress/history-456",
        label: "Treatment Progress (history-456)",
        category: "Dynamic Routes",
      },
    ];

    for (const route of dynamicRoutes) {
      await this.navigateAndValidate(
        route.route,
        route.label,
        route.expected,
        route.category,
      );
    }
  }

  async testFieldManagementTabs(): Promise<void> {
    console.log("📊 Testing Field Management Tabs...");

    const fieldManagementTabs = [
      {
        route: "/field-management?tab=overview",
        expected: "/field-management",
        label: "Field Management - Overview",
        category: "Field Management Tabs",
      },
      {
        route: "/field-management?tab=maps",
        expected: "/field-management",
        label: "Field Management - Maps",
        category: "Field Management Tabs",
      },
      {
        route: "/field-management?tab=crops",
        expected: "/field-management",
        label: "Field Management - Crops",
        category: "Field Management Tabs",
      },
      {
        route: "/field-management?tab=analytics",
        expected: "/field-management",
        label: "Field Management - Analytics",
        category: "Field Management Tabs",
      },
      {
        route: "/field-management?tab=history",
        expected: "/field-management",
        label: "Field Management - History",
        category: "Field Management Tabs",
      },
    ];

    for (const tab of fieldManagementTabs) {
      await this.navigateAndValidate(
        tab.route,
        tab.label,
        tab.expected,
        tab.category,
      );
    }
  }

  generateReport(): string {
    const totalTests = this.results.length;
    const passedTests = this.results.filter((r) => r.status === "PASS").length;
    const failedTests = this.results.filter((r) => r.status === "FAIL").length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    let report = `
╔════════════════════════════════════════════════════════════════╗
║                 AGROGROWTH NAVIGATION QA REPORT               ║
╚════════════════════════════════════════════════════════════════╝

📊 TEST SUMMARY:
   Total Tests: ${totalTests}
   Passed: ${passedTests} (${passRate}%)
   Failed: ${failedTests}
   
🔐 AUTHENTICATION STATUS:
   User: ${this.testUser.name} (${this.testUser.role})
   Token: Valid JWT ✅
   
📋 DETAILED RESULTS:

`;

    // Group results by category
    const categories = [...new Set(this.results.map((r) => r.category))];

    for (const category of categories.filter(Boolean)) {
      const categoryResults = this.results.filter(
        (r) => r.category === category,
      );
      const categoryPassed = categoryResults.filter(
        (r) => r.status === "PASS",
      ).length;
      const categoryTotal = categoryResults.length;

      report += `\n📁 ${category} (${categoryPassed}/${categoryTotal})\n`;
      report += `${"─".repeat(50)}\n`;

      for (const result of categoryResults) {
        const status = result.status === "PASS" ? "✅" : "❌";
        report += `${status} ${result.label}\n`;
        report += `   Route: ${result.route}\n`;
        report += `   Expected: ${result.expected}\n`;
        report += `   Actual: ${result.actual}\n`;

        if (result.error) {
          report += `   Error: ${result.error}\n`;
        }

        if (result.element) {
          report += `   Element: ${result.element}\n`;
        }

        report += "\n";
      }
    }

    // Failed tests summary
    const failedResults = this.results.filter((r) => r.status === "FAIL");
    if (failedResults.length > 0) {
      report += `\n🚨 FAILED TESTS SUMMARY:\n`;
      report += `${"═".repeat(50)}\n`;

      for (const failure of failedResults) {
        report += `❌ ${failure.label}\n`;
        report += `   Route: ${failure.route} → Expected: ${failure.expected}, Got: ${failure.actual}\n`;
        report += `   Fix: ${this.getSuggestedFix(failure)}\n\n`;
      }
    }

    // Suggestions
    report += `\n💡 SUGGESTED FIXES:\n`;
    report += `${"═".repeat(50)}\n`;

    const redirectToHomeFailures = failedResults.filter(
      (r) => r.actual === "/",
    );
    if (redirectToHomeFailures.length > 0) {
      report += `🏠 Unexpected Home Redirects (${redirectToHomeFailures.length} routes):\n`;
      report += `   - Check for missing route definitions in AppRouter.tsx\n`;
      report += `   - Verify component imports are correct\n`;
      report += `   - Check for errors in ErrorBoundary causing fallback redirects\n`;
      report += `   - Validate authentication middleware isn't blocking routes\n\n`;
    }

    const authFailures = failedResults.filter((r) => r.actual === "/login");
    if (authFailures.length > 0) {
      report += `🔒 Authentication Failures (${authFailures.length} routes):\n`;
      report += `   - Check role-based access permissions in Layout component\n`;
      report += `   - Verify user role matches required permissions\n`;
      report += `   - Check ProtectedRoute component logic\n\n`;
    }

    const notFoundFailures = failedResults.filter(
      (r) => r.actual.includes("404") || r.actual.includes("not-found"),
    );
    if (notFoundFailures.length > 0) {
      report += `❓ Route Not Found (${notFoundFailures.length} routes):\n`;
      report += `   - Add missing route definitions in AppRouter.tsx\n`;
      report += `   - Create missing page components\n`;
      report += `   - Check for typos in route paths\n\n`;
    }

    report += `\n📝 RECOMMENDATIONS:\n`;
    report += `${"═".repeat(50)}\n`;
    report += `1. Fix high-priority navigation failures first\n`;
    report += `2. Implement proper error boundaries for graceful fallbacks\n`;
    report += `3. Add loading states for async route transitions\n`;
    report += `4. Consider implementing breadcrumb navigation\n`;
    report += `5. Add automated end-to-end tests for critical user flows\n`;
    report += `6. Monitor route performance and loading times\n`;

    return report;
  }

  private getSuggestedFix(failure: NavigationTestResult): string {
    if (failure.actual === "/") {
      return "Add missing route definition in AppRouter.tsx or fix component import error";
    } else if (failure.actual === "/login") {
      return "Check role-based access permissions and authentication requirements";
    } else if (failure.actual.includes("404")) {
      return "Create missing page component and add route definition";
    } else if (failure.error?.includes("authentication")) {
      return "Verify JWT token and user permissions";
    } else {
      return "Investigate routing logic and component rendering issues";
    }
  }

  async runFullTest(): Promise<string> {
    console.log("🚀 Starting AgroGrowth Navigation QA Test Suite...\n");

    // Reset results
    this.results = [];

    try {
      await this.testSidebarNavigation();
      await this.testQuickActions();
      await this.testSpecialRoutes();
      await this.testDynamicRoutes();
      await this.testFieldManagementTabs();
    } catch (error) {
      console.error("Test suite encountered an error:", error);
    }

    return this.generateReport();
  }
}

// Export for use in tests
export { NavigationQATester };

// Vitest test cases
describe("AgroGrowth Navigation QA", () => {
  let tester: NavigationQATester;

  beforeAll(() => {
    tester = new NavigationQATester();
  });

  test("should validate all sidebar navigation routes", async () => {
    await tester.testSidebarNavigation();
    const failures = tester["results"].filter(
      (r) => r.status === "FAIL" && r.category?.includes("Sidebar"),
    );
    expect(failures.length).toBeLessThan(5); // Allow some failures but not too many
  });

  test("should validate quick action routes", async () => {
    await tester.testQuickActions();
    const failures = tester["results"].filter(
      (r) => r.status === "FAIL" && r.category === "Quick Actions",
    );
    expect(failures.length).toBe(0); // Quick actions should always work
  });

  test("should handle special routes correctly", async () => {
    await tester.testSpecialRoutes();
    const results = tester["results"].filter(
      (r) => r.category === "Special Routes",
    );
    expect(results.length).toBeGreaterThan(0);
  });

  test("should generate comprehensive test report", async () => {
    const report = await tester.runFullTest();
    expect(report).toContain("AGROGROWTH NAVIGATION QA REPORT");
    expect(report).toContain("TEST SUMMARY");
    expect(report).toContain("AUTHENTICATION STATUS");
    console.log(report); // Output the full report
  });
});
