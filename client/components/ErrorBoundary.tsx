import React, { Component, ErrorInfo, ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallbackRoute?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Log error for monitoring
    this.logError(error, errorInfo);

    // Auto-redirect after longer delay to allow debugging
    setTimeout(() => {
      this.setState({ hasError: false });
      window.location.href = this.props.fallbackRoute || "/";
    }, 5000);
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Store error in localStorage for debugging
    const existingErrors = JSON.parse(
      localStorage.getItem("agrogrowth_errors") || "[]",
    );
    existingErrors.push(errorReport);

    // Keep only last 10 errors
    if (existingErrors.length > 10) {
      existingErrors.shift();
    }

    localStorage.setItem("agrogrowth_errors", JSON.stringify(existingErrors));

    // Report to console
    console.error("AgroGrowth Error Report:", errorReport);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h1 className="text-xl font-bold text-gray-900 mb-2">
                حدث خطأ غير متوقع
              </h1>

              <p className="text-gray-600 mb-6">
                سيتم توجيهك إلى الصفحة الرئيسية خلال ثوانٍ قليلة...
              </p>

              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full animate-pulse"
                    style={{ width: "100%" }}
                  ></div>
                </div>

                <button
                  onClick={() =>
                    (window.location.href = this.props.fallbackRoute || "/")
                  }
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  العودة إلى الصفحة الرئيسية
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
