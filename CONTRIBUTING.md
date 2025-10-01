# 🤝 Contributing to AgroGrowth Platform

Thank you for your interest in contributing to the AgroGrowth Platform! This document provides guidelines and information for contributors.

## 🌟 Ways to Contribute

### Code Contributions

- **Bug fixes**: Help resolve issues and improve stability
- **Feature development**: Add new functionality to benefit farmers
- **Performance improvements**: Optimize code and infrastructure
- **Documentation**: Improve guides, comments, and examples
- **Testing**: Add test coverage and improve quality assurance

### Non-Code Contributions

- **Agricultural expertise**: Domain knowledge and farming insights
- **Translation**: Help localize the platform for different regions
- **Design**: UI/UX improvements and accessibility enhancements
- **Community support**: Help other contributors and users
- **Bug reporting**: Identify and report issues

## 🚀 Getting Started

### 1. Set Up Development Environment

#### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+ (for AI services)
- **Git** for version control
- **Code editor** (VS Code recommended)

#### Clone and Setup

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/platform.git
cd platform

# Add upstream remote
git remote add upstream https://github.com/agrogrowth/platform.git

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

#### Start Development Servers

```bash
# Start backend (Terminal 1)
npm run server:dev

# Start frontend (Terminal 2)
npm run dev
```

### 2. Understand the Codebase

#### Project Structure

```
platform/
├── client/           # React frontend
├── server/           # Express.js backend
├── agrogrowth-ai/    # AI microservices
├── models/           # ML model files
├── prompts/          # AI prompt templates
├── tests/            # Test suites
└── docs/             # Documentation
```

#### Key Technologies

- **Frontend**: React 18, TypeScript, TailwindCSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **AI Services**: Python, Flask, scikit-learn, TensorFlow
- **Database**: PostgreSQL (production), SQLite (development)
- **Testing**: Jest, Cypress, Pytest

## 📝 Development Workflow

### 1. Choose an Issue

#### Finding Issues

- Check [open issues](https://github.com/agrogrowth/platform/issues)
- Look for labels:
  - `good first issue`: Great for beginners
  - `help wanted`: Community help needed
  - `bug`: Bug fixes needed
  - `enhancement`: New features
  - `documentation`: Documentation improvements

#### Creating New Issues

Before creating an issue, check if it already exists. Include:

- Clear description of the problem or feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots or examples if relevant
- Environment details (OS, browser, Node version)

### 2. Create a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Make Your Changes

#### Code Style Guidelines

**TypeScript/JavaScript:**

```typescript
// Use TypeScript for type safety
interface SoilData {
  ph: number;
  moisture: number;
  nitrogen: number;
}

// Use async/await over promises
async function analyzeSoil(data: SoilData): Promise<SoilAnalysis> {
  try {
    const result = await soilService.analyze(data);
    return result;
  } catch (error) {
    logger.error("Soil analysis failed:", error);
    throw error;
  }
}

// Use descriptive variable names
const cropRecommendations = await getCropRecommendations(soilData);
```

**React Components:**

```tsx
// Use functional components with hooks
import React, { useState, useEffect } from "react";

interface SoilAnalysisProps {
  onComplete: (result: SoilAnalysis) => void;
}

const SoilAnalysis: React.FC<SoilAnalysisProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Component logic here

  return <div className="soil-analysis">{/* Component JSX */}</div>;
};

export default SoilAnalysis;
```

**CSS/Styling:**

```css
/* Use TailwindCSS classes */
<div className="flex flex-col space-y-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-900">Soil Analysis</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Content */}
  </div>
</div>

/* For RTL support */
<div className="text-right rtl:text-left">
  نتائج تحليل التربة
</div>
```

#### Arabic/RTL Considerations

- Always provide Arabic translations for user-facing text
- Test RTL layout with Arabic content
- Use semantic HTML for proper text direction
- Consider cultural contexts in UX design

```tsx
// Good: RTL-aware component
const WelcomeMessage: React.FC = () => {
  const { isArabic } = useLanguage();

  return (
    <div className={`text-center ${isArabic ? "rtl" : "ltr"}`}>
      <h1 className="text-2xl font-bold">
        {isArabic
          ? "مرحباً بك في منصة النمو الزراعي"
          : "Welcome to AgroGrowth Platform"}
      </h1>
    </div>
  );
};
```

#### Testing Requirements

**Write Tests for New Features:**

```typescript
// Unit test example
describe("SoilAnalyzer", () => {
  it("should classify soil type correctly", async () => {
    const soilData = {
      ph: 6.5,
      moisture: 45,
      nitrogen: 85,
    };

    const result = await soilAnalyzer.analyze(soilData);

    expect(result.soilType).toBe("Sandy Loam");
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
```

**Integration Test Example:**

```typescript
// API test example
describe("POST /api/ai/soil/analyze", () => {
  it("should return soil analysis results", async () => {
    const response = await request(app)
      .post("/api/ai/soil/analyze")
      .send({
        sensor_data: {
          ph: 6.5,
          moisture: 45,
          nitrogen: 85,
        },
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.soil_type).toBeDefined();
  });
});
```

**E2E Test Example:**

```typescript
// Cypress test example
describe("Soil Analysis Flow", () => {
  it("should complete soil analysis workflow", () => {
    cy.visit("/");
    cy.get('[data-testid="soil-analysis-card"]').click();

    // Fill form
    cy.get('[data-testid="ph-input"]').type("6.5");
    cy.get('[data-testid="moisture-input"]').type("45");

    // Submit and verify results
    cy.get('[data-testid="analyze-btn"]').click();
    cy.get('[data-testid="results"]').should("be.visible");
  });
});
```

### 4. Commit Your Changes

#### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: type(scope): description
# Types: feat, fix, docs, style, refactor, test, chore

# Examples:
git commit -m "feat(soil): add new soil classification algorithm"
git commit -m "fix(api): resolve CORS issue in production"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(soil): add unit tests for pH analysis"
git commit -m "refactor(ui): simplify dashboard layout"
```

#### Commit Best Practices

- Make atomic commits (one logical change per commit)
- Write clear, descriptive commit messages
- Include issue number if applicable: `fixes #123`
- Test your changes before committing

### 5. Submit a Pull Request

#### Before Submitting

```bash
# Run tests
npm run test
npm run test:e2e
npm run lint

# Check TypeScript
npm run type-check

# Test build
npm run build
```

#### Pull Request Template

When creating a PR, include:

```markdown
## Description

Brief description of changes made.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots

If applicable, add screenshots showing the changes.

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] Arabic translations added (if user-facing)

## Related Issues

Fixes #123
Related to #456
```

#### Pull Request Guidelines

- Create a clear title and description
- Link to related issues
- Add screenshots for UI changes
- Request review from relevant maintainers
- Respond to feedback promptly
- Keep PRs focused and reasonably sized

## 🧪 Testing Guidelines

### Test Categories

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test API endpoints and service interactions
3. **E2E Tests**: Test complete user workflows
4. **Performance Tests**: Test response times and load handling

### Testing Requirements

- **New features** must include unit tests
- **Bug fixes** should include regression tests
- **API changes** require integration tests
- **UI changes** should include E2E tests

### Test Data

```typescript
// Use realistic test data for agriculture domain
const mockSoilData = {
  ph: 6.5,
  moisture: 45,
  nitrogen: 85,
  phosphorus: 42,
  potassium: 118,
  temperature: 24.5,
  location: {
    latitude: 36.8065,
    longitude: 10.1815,
    region: "Tunis",
  },
};

const mockCropRecommendations = [
  {
    crop: "wheat",
    crop_name_ar: "قمح",
    suitability_score: 92,
    expected_yield: 4.2,
  },
];
```

## 🌍 Localization Contributions

### Adding Translations

1. **Identify missing translations**
2. **Add Arabic translations** for all user-facing text
3. **Consider cultural context** for Tunisian farmers
4. **Test RTL layout** with new content

### Translation Guidelines

```typescript
// Translation structure
const translations = {
  en: {
    soilAnalysis: {
      title: "Soil Analysis",
      ph: "pH Level",
      moisture: "Moisture Content",
      recommendations: "Recommendations",
    },
  },
  ar: {
    soilAnalysis: {
      title: "تحليل التربة",
      ph: "مستوى الحموضة",
      moisture: "محتوى الرطوبة",
      recommendations: "التوصيات",
    },
  },
};
```

### Agricultural Terminology

Use accurate Arabic agricultural terms:

- Soil → التربة
- pH → الأس الهيدروجيني / الحموضة
- Nitrogen → النيتروجين
- Phosphorus → الفوسفور
- Potassium → البوتاسيوم
- Irrigation → الري
- Fertilizer → السماد
- Harvest → الحصاد

## 🎨 Design Contributions

### UI/UX Guidelines

1. **Accessibility**: Follow WCAG 2.1 guidelines
2. **Mobile-first**: Design for mobile devices primarily
3. **RTL Support**: Ensure proper Arabic layout
4. **Color Contrast**: Maintain sufficient contrast ratios
5. **Touch Targets**: Minimum 44px for interactive elements

### Design Assets

- Use **Figma** for design mockups
- Provide **SVG icons** when possible
- Include **dark mode** variants
- Consider **low-bandwidth** scenarios

## 🚀 AI/ML Contributions

### Model Development

1. **Data Requirements**: Use relevant agricultural datasets
2. **Model Validation**: Include cross-validation and metrics
3. **Documentation**: Explain model architecture and performance
4. **Integration**: Provide clear API interfaces

### AI Service Guidelines

```python
# Model structure example
class SoilClassifier:
    def __init__(self, model_path: str):
        self.model = self.load_model(model_path)

    def predict(self, sensor_data: dict) -> dict:
        """
        Predict soil type from sensor data

        Args:
            sensor_data: Dictionary with pH, moisture, nutrients

        Returns:
            Dictionary with soil_type, confidence, recommendations
        """
        # Implementation here
        pass
```

### Model Performance Standards

- **Accuracy**: Minimum 85% for production models
- **Response Time**: Under 2 seconds for real-time predictions
- **Documentation**: Include performance metrics and limitations
- **Fallbacks**: Provide dummy responses when models fail

## 📚 Documentation Contributions

### Documentation Types

1. **Code Comments**: Explain complex logic
2. **API Documentation**: Document all endpoints
3. **User Guides**: Help farmers use the platform
4. **Developer Docs**: Help other contributors

### Documentation Standards

````typescript
/**
 * Analyzes soil composition and provides recommendations
 *
 * @param sensorData - Raw sensor readings from field devices
 * @param location - Geographic location of the soil sample
 * @returns Promise resolving to soil analysis results
 *
 * @example
 * ```typescript
 * const analysis = await analyzeSoil({
 *   ph: 6.5,
 *   moisture: 45,
 *   nitrogen: 85
 * }, {
 *   latitude: 36.8065,
 *   longitude: 10.1815
 * });
 * ```
 */
async function analyzeSoil(
  sensorData: SoilSensorData,
  location: GeoLocation,
): Promise<SoilAnalysis> {
  // Implementation
}
````

## 🐛 Bug Report Guidelines

### Good Bug Reports Include:

1. **Clear title** describing the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment details** (OS, browser, device)
5. **Screenshots/videos** if applicable
6. **Error messages** and console logs

### Bug Report Template

```markdown
## Bug Description

A clear description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Screenshots

Add screenshots to help explain the problem.

## Environment

- OS: [e.g. Windows 10, macOS 12.1, Ubuntu 20.04]
- Browser: [e.g. Chrome 96, Firefox 95, Safari 15]
- Device: [e.g. Desktop, iPhone 12, Samsung Galaxy S21]
- App Version: [e.g. v1.2.3]

## Additional Context

Any other context about the problem.
```

## 🎖️ Recognition

### Contributor Levels

1. **First-time Contributors**: Welcome and guidance provided
2. **Regular Contributors**: Recognition in release notes
3. **Core Contributors**: Repository collaborator access
4. **Maintainers**: Full project access and responsibilities

### Contributor Benefits

- **Recognition**: Listed in CONTRIBUTORS.md
- **Swag**: AgroGrowth stickers and merchandise
- **Networking**: Connect with agricultural technology community
- **Learning**: Gain experience with modern web technologies
- **Impact**: Help improve agriculture in Tunisia and beyond

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: Real-time chat with contributors
- **Email**: dev@agrogrowth.tn for sensitive issues

### Mentorship Program

New contributors can request mentorship:

- Assign yourself to a `good first issue`
- Comment asking for guidance
- A maintainer will provide support

### Code Review Process

1. **Self Review**: Review your own changes first
2. **Automated Checks**: CI must pass
3. **Peer Review**: At least one approval required
4. **Maintainer Review**: Final approval from maintainer
5. **Merge**: Squash and merge for clean history

## 📋 Contributor Agreement

By contributing to AgroGrowth Platform, you agree that:

1. Your contributions are original work or properly attributed
2. You have the right to submit your contributions
3. Your contributions are licensed under the MIT License
4. You'll follow the Code of Conduct and community guidelines

## 🙏 Thank You

Thank you for contributing to AgroGrowth Platform! Your efforts help improve agricultural practices and support farmers in Tunisia and beyond. Every contribution, no matter how small, makes a difference.

---

**Happy Contributing! 🌱**

For questions about contributing, reach out to the maintainers or join our Discord community.
