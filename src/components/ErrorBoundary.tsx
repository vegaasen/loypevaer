import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { NavBar } from "./NavBar";

type Props = {
  children: ReactNode;
  /** Custom fallback UI. If omitted a generic message is shown. */
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
  /** Incremented on retry to force a full remount of children. */
  resetKey: number;
};

/**
 * Thin wrapper whose sole purpose is to receive a `key` prop so that
 * incrementing `resetKey` forces React to unmount + remount the child tree.
 */
function ChildrenContainer({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <>
          <NavBar />
          <div className="status-page">
            <div className="status-card">
              <h2 className="status-card__title">Noe gikk galt</h2>
              <p className="status-card__body">
                En uventet feil oppstod. Du kan prøve igjen, eller gå tilbake til forsiden.
              </p>
              <div className="status-card__actions">
                <button
                  className="status-card__btn"
                  onClick={() =>
                    this.setState((s) => ({
                      hasError: false,
                      error: null,
                      resetKey: s.resetKey + 1,
                    }))
                  }
                >
                  Prøv igjen
                </button>
                <Link to="/" className="status-card__link">
                  ← Gå til forsiden
                </Link>
              </div>
            </div>
          </div>
        </>
      );
    }

    return (
      <ChildrenContainer key={this.state.resetKey}>
        {this.props.children}
      </ChildrenContainer>
    );
  }
}
