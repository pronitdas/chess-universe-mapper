import React, { Component, ErrorInfo, ReactNode } from 'react';
import App from './App';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: '#1a1a1a',
          color: '#fff',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>Application Error</h1>
          <p style={{ marginBottom: '8px' }}>Something went wrong loading the application:</p>
          <pre style={{
            background: '#333',
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {this.state.error?.toString()}
          </pre>
          <p style={{ marginTop: '16px', color: '#888' }}>
            Try checking the browser console for more details.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = document.getElementById("root");
if (root) {
  import('react-dom/client').then(({ createRoot }) => {
    createRoot(root).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  });
} else {
  document.body.innerHTML = '<div style="padding: 20px; color: #fff; background: #1a1a1a;"><h1>Error: Root element not found</h1><p>The root element with id "root" was not found in the document.</p></div>';
}
