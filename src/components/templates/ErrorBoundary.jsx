import React from "react";
import { logClientError } from "../../services/clientLogger.js";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logClientError("react_render_error", error, {
      componentStack: errorInfo?.componentStack
    });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="grid min-h-screen place-items-center bg-brand-50 p-6 text-black">
        <section
          aria-labelledby="app-error-title"
          className="w-full max-w-lg rounded-2xl border border-brand-200 bg-white p-6"
          role="alert"
        >
          <p className="text-sm font-medium text-[#5e5e5e]">Something went wrong</p>
          <h1 id="app-error-title" className="mt-2 text-3xl font-bold">
            Creative Operations could not load this view.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#5e5e5e]">
            Your data is kept in this browser. Reload the app to recover the workspace.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="focus-ring mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white"
          >
            Reload app
          </button>
        </section>
      </main>
    );
  }
}
