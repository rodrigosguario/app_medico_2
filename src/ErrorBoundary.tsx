import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string; details?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown) {
    let msg = "";
    let details = "";
    if (error instanceof Error) {
      msg = error.message;
      details = error.stack || "";
    } else {
      msg = String(error);
    }
    return { hasError: true, message: msg, details };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error("[ErrorBoundary] Capturado:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
          padding: 24
        }}>
          <h1>Opa! Algo quebrou na inicialização.</h1>
          <p><strong>Mensagem:</strong> {this.state.message}</p>
          {this.state.details && (
            <pre style={{
              background: "#eee",
              padding: "8px",
              borderRadius: "4px",
              marginTop: "12px",
              maxHeight: "200px",
              overflow: "auto"
            }}>
              {this.state.details}
            </pre>
          )}
          <p style={{ marginTop: 12 }}>
            Veja o <strong>Console</strong> (F12 → aba Console) e copie para mim a mensagem completa do erro.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
