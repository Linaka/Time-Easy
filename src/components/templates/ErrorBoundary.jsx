import React from "react";
import { logClientError } from "../../services/clientLogger.js";
import styles from "./ErrorBoundary.module.css";

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
      <main className={styles["error-boundary"]}>
        <section
          aria-labelledby="app-error-title"
          className={styles["error-boundary__panel"]}
          role="alert"
        >
          <p className={styles["error-boundary__eyebrow"]}>Something went wrong</p>
          <h1 id="app-error-title" className={styles["error-boundary__title"]}>
            Creative Operations could not load this view.
          </h1>
          <p className={styles["error-boundary__body"]}>
            Your data is kept in this browser. Reload the app to recover the workspace.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={styles["error-boundary__button"]}
          >
            Reload app
          </button>
        </section>
      </main>
    );
  }
}
