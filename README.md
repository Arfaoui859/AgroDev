# 🌾 AgroGrowth Platform

> **AI-Powered Agricultural Management Platform for Tunisia**

[![Build Status](https://github.com/agrogrowth/platform/workflows/CI/badge.svg)](https://github.com/agrogrowth/platform/actions)
[![Coverage](https://codecov.io/gh/agrogrowth/platform/branch/main/graph/badge.svg)](https://codecov.io/gh/agrogrowth/platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/github/v/release/agrogrowth/platform)](https://github.com/agrogrowth/platform/releases)

## 🎯 Project Overview

AgroGrowth is a comprehensive, AI-powered agricultural management platform specifically designed for Tunisian farmers and agricultural stakeholders. The platform combines modern web technologies with artificial intelligence to provide intelligent crop recommendations, soil analysis, market insights, and collaborative tools.

### 🌟 Key Features

- **🧠 AI-Powered Analysis**: Soil health assessment, crop recommendations, and disease detection
- **📊 Market Intelligence**: Real-time price forecasting and investment insights
- **👥 Farmer Collaboration**: Expert consultations, community forums, and knowledge sharing
- **🎮 Gamification**: XP system, achievements, and leaderboards to encourage best practices
- **📱 Offline-First**: Works without internet connection with automatic synchronization
- **🌍 Localization**: Full Arabic RTL support with French and English options
- **📈 Analytics**: Comprehensive dashboards for farmers, investors, and agronomists

## 🏗️ Architecture

### Frontend

- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **TailwindCSS** for responsive, RTL-compatible styling
- **Radix UI** for accessible component primitives
- **React Router 6** for client-side routing
- **Recharts** for data visualization

### Backend

- **Node.js** with Express.js and TypeScript
- **RESTful API** design with comprehensive error handling
- **File upload** support with Multer
- **CORS** enabled for cross-origin requests

### AI Services

- **Python microservices** for machine learning models
- **Modular architecture** with separate services for:
  - Soil analysis and classification
  - Crop recommendation engine
  - Plant disease detection
  - Market price forecasting

### Infrastructure

- **Docker** containerization for consistent deployment
- **GitHub Actions** CI/CD pipeline
- **Netlify/Vercel** for frontend hosting
- **Railway** for backend deployment

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+ (for AI services)
- **Docker** (optional, for containerized development)
- **Git** for version control

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/agrogrowth/platform.git
   cd platform
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**

   ```bash
   # Start backend server (port 8080)
   npm run server:dev

   # Start frontend development server (port 5173)
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080/api

### Docker Development (Alternative)

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📂 Project Structure

```
agrogrowth-platform/
├��─ 📁 client/                     # Frontend React application
│   ├── 📁 components/             # Reusable UI components
│   ├── 📁 pages/                  # Page components
│   ├── 📁 hooks/                  # Custom React hooks
│   ├── 📁 contexts/               # React context providers
│   └── 📁 lib/                    # Utility functions
├── 📁 server/                     # Backend Express application
│   ├── 📁 routes/                 # API route handlers
│   └── index.ts                   # Server entry point
├── 📁 agrogrowth-ai/             # AI microservices
│   ├── 📁 soil_analysis/          # Soil analysis service
│   ├── 📁 crop_recommendation/    # Crop recommendation service
│   ├── 📁 image_diagnosis/        # Plant disease detection
│   └── 📁 ai_common/             # Shared AI utilities
├── 📁 models/                     # AI model files and loaders
│   ├── 📁 soil_analysis/          # Soil classification models
│   ├── 📁 crop_recommendation/    # Crop matching models
│   └── 📁 image_diagnosis/        # Disease detection models
├── 📁 prompts/                    # AI prompt templates
│   ├── 📁 diagnosis/              # Disease diagnosis prompts
│   ├── 📁 recommendations/        # Recommendation prompts
│   └── 📁 communication/          # Farmer communication prompts
├── 📁 tests/                      # Test suites
│   ├── 📁 integration/            # API integration tests
│   └── 📁 e2e/                    # End-to-end tests
├── 📁 .github/workflows/          # CI/CD pipelines
├── 📁 cypress/                    # Cypress E2E tests
└── 📁 shared/                     # Shared utilities and types
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                    # Start frontend development server
npm run server:dev            # Start backend development server

# Building
npm run build                 # Build frontend for production
npm run preview              # Preview production build

# Testing
npm run test                 # Run unit tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate coverage report
npm run test:integration    # Run integration tests
npm run test:e2e           # Run Cypress E2E tests
npm run test:e2e:open      # Open Cypress test runner

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix          # Fix linting issues
npm run type-check        # TypeScript type checking

# AI Services
cd agrogrowth-ai
python -m pytest         # Run AI service tests
```

### Development Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   - Write tests for new functionality
   - Follow the existing code style
   - Update documentation as needed

3. **Test your changes**

   ```bash
   npm run test
   npm run test:e2e
   npm run lint
   ```

4. **Commit and push**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Describe your changes
   - Link to relevant issues
   - Wait for review and CI to pass

## 🧪 Testing

### Test Structure

- **Unit Tests**: Jest for individual component and function testing
- **Integration Tests**: Supertest for API endpoint testing
- **E2E Tests**: Cypress for complete user flow testing
- **AI Tests**: Pytest for machine learning model testing

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test                    # Unit tests
npm run test:integration        # API tests
npm run test:e2e               # E2E tests

# Run with coverage
npm run test:coverage

# AI service tests
cd agrogrowth-ai
python -m pytest tests/ -v --cov=.
```

### Test Configuration

- **Jest**: Configured in `jest.config.js`
- **Cypress**: Configured in `cypress.config.ts`
- **Test Environment**: Uses `.env.test` for test-specific configuration

## 🚀 Deployment

### Production Deployment

The platform uses automated deployment through GitHub Actions:

1. **Staging Deployment**

   - Triggers on pushes to `develop` branch
   - Deploys to staging environment
   - Runs smoke tests

2. **Production Deployment**
   - Triggers on tagged releases
   - Requires manual approval
   - Full health checks and monitoring

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy frontend to Netlify
npx netlify deploy --prod --dir=dist

# Deploy backend to Railway
railway up --service backend
```

### Docker Deployment

```bash
# Build production image
docker build -t agrogrowth:latest .

# Run container
docker run -p 8080:8080 agrogrowth:latest
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Application
NODE_ENV=production
PORT=8080
APP_URL=https://agrogrowth.tn

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# AI Services
SOIL_ANALYSIS_URL=http://ai-soil:8001
CROP_RECOMMENDATION_URL=http://ai-crop:8002

# External APIs
WEATHER_API_KEY=your_weather_api_key
MARKET_API_KEY=your_market_api_key
```

### Feature Flags

Control features through environment variables:

```bash
ENABLE_AI_SERVICES=true
ENABLE_OFFLINE_MODE=true
ENABLE_NOTIFICATIONS=true
MOCK_AI_SERVICES=false
```

## 🌍 Localization

The platform supports multiple languages with RTL support:

- **Arabic (العربية)**: Primary language with RTL layout
- **French (Français)**: Secondary language for technical documentation
- **English**: International support

### Adding Translations

1. Add translations to language files in `client/locales/`
2. Use the `useLanguage` hook in components
3. Ensure RTL compatibility in CSS

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
3. **Follow coding standards**

   - Use TypeScript for type safety
   - Follow existing code style
   - Write tests for new features
   - Update documentation

4. **Commit with conventional commits**

   ```bash
   feat: add new feature
   fix: resolve bug
   docs: update documentation
   test: add test coverage
   ```

5. **Submit a Pull Request**

### Code Style Guidelines

- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured for React and TypeScript
- **Prettier**: Automatic code formatting
- **Component Structure**: Functional components with hooks
- **File Naming**: PascalCase for components, camelCase for utilities

## 📊 API Documentation

### Main Endpoints

```bash
# Health Check
GET /api/health

# AI Services
POST /api/ai/soil/analyze          # Soil analysis
POST /api/ai/crops/recommend       # Crop recommendations
POST /api/ai/images/detect-disease # Disease detection

# Market Data
GET /api/market/prices             # Current market prices
GET /api/market/trends             # Market trends

# User Management
POST /api/auth/login               # User authentication
GET /api/user/profile              # User profile

# Gamification
GET /api/gamification/profile      # User XP and level
GET /api/gamification/leaderboard  # Community leaderboard
```

### API Response Format

```json
{
  "success": true,
  "data": {
    "result": "API response data"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Handling

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed error message",
    "details": {}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔒 Security

### Security Measures

- **Input Validation**: All user inputs are validated and sanitized
- **CORS Configuration**: Properly configured for production
- **Rate Limiting**: API endpoints are rate-limited
- **File Upload Security**: File type and size restrictions
- **Environment Variables**: Sensitive data stored securely

### Security Best Practices

- Regular dependency updates
- Security scanning in CI/CD
- Proper error handling (no sensitive data exposure)
- HTTPS enforcement in production
- Secure headers configuration

## 📈 Performance

### Performance Optimizations

- **Code Splitting**: Lazy loading for route components
- **Image Optimization**: WebP format with fallbacks
- **Caching**: Redis caching for API responses
- **Minification**: CSS and JavaScript optimization
- **CDN**: Static asset delivery optimization

### Performance Monitoring

- **Lighthouse CI**: Automated performance testing
- **Web Vitals**: Core performance metrics tracking
- **Error Monitoring**: Sentry integration for error tracking

## 🐛 Troubleshooting

### Common Issues

**Q: Development server won't start**

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Q: AI services not responding**

```bash
# Check if AI services are running
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
```

**Q: Build fails with TypeScript errors**

```bash
# Run type checking
npm run type-check
# Fix reported type errors
```

**Q: Tests failing in CI**

```bash
# Run tests locally with same environment
NODE_ENV=test npm run test
```

### Debugging

- **Backend**: Use `DEBUG=app:*` environment variable
- **Frontend**: React Developer Tools extension
- **Network**: Browser developer tools Network tab
- **Database**: Use Adminer at http://localhost:8081

## 📞 Support

### Getting Help

- **Documentation**: Check this README and docs folder
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact dev@agrogrowth.tn for urgent issues

### Community

- **Discord**: Join our development community
- **Newsletter**: Subscribe for updates
- **Blog**: Read about agricultural technology trends

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tunisian Ministry of Agriculture** for domain expertise
- **Local farming cooperatives** for testing and feedback
- **Open source community** for excellent tools and libraries
- **Contributors** who help improve the platform

## 🎯 Roadmap

### Version 2.0 (Q2 2024)

- [ ] Mobile application (React Native)
- [ ] Advanced ML models for yield prediction
- [ ] Blockchain integration for supply chain tracking
- [ ] IoT sensor integration
- [ ] Advanced analytics and reporting

### Version 3.0 (Q4 2024)

- [ ] Multi-country support (Morocco, Algeria)
- [ ] Satellite imagery integration
- [ ] Carbon footprint tracking
- [ ] Marketplace integration
- [ ] Financial services integration

---

<div align="center">

**Built with ❤️ for Tunisian farmers**

[🌐 Website](https://agrogrowth.tn) • [📧 Contact](mailto:contact@agrogrowth.tn) • [📱 Mobile App](https://app.agrogrowth.tn)

</div>
