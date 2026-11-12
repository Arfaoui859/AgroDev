import React, { Component, ErrorInfo, ReactNode } from "react";

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
    this.logError(error, errorInfo);
    // No automatic redirect: bouncing the user to the home page silently
    // discards their session state and is itself a cause of "the app shows the
    // wrong page". The user decides whether to retry or go home.
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

    // Store error in localStorage for debugging. Reading the existing log can
    // throw on a corrupt value, which would crash the boundary itself.
    try {
      const raw = localStorage.getItem("agrogrowth_errors");
      const existingErrors = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(existingErrors) ? existingErrors : [];
      list.push(errorReport);
      if (list.length > 10) list.shift();
      localStorage.setItem("agrogrowth_errors", JSON.stringify(list));
    } catch (e) {
      console.warn("Could not persist error report:", e);
    }

    console.error("AgroGrowth Error Report:", errorReport);
  }

  private goHome = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.assign(this.props.fallbackRoute || "/");
  };

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

              <p className="text-gray-600 mb-2">
                تعذّر عرض هذه الصفحة. يمكنك إعادة المحاولة أو العودة إلى الصفحة
                الرئيسية. لم يتم فقدان بياناتك المحفوظة.
              </p>

              {this.state.error?.message ? (
                <p className="text-xs text-gray-400 mb-6 break-words">
                  {this.state.error.message}
                </p>
              ) : (
                <div className="mb-6" />
              )}

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  إعادة المحاولة
                </button>
                <button
                  onClick={this.goHome}
                  className="w-full bg-white text-green-700 border border-green-600 py-2 px-4 rounded-md hover:bg-green-50 transition-colors"
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
