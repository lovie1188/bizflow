// frontend/src/components/ErrorBoundary.jsx
// L-5: React Error Boundary — catches unhandled render errors and shows a user-friendly fallback
// instead of a blank/broken page. Wrap around any route or section that may throw.

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in development — in production you could send to an error tracking service
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '40px 24px',
          textAlign: 'center',
          fontFamily: 'inherit'
        }}>
          <div style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '480px',
            width: '100%'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ color: '#c2410c', margin: '0 0 8px', fontSize: '1.25rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#78716c', margin: '0 0 24px', fontSize: '0.9rem' }}>
              An unexpected error occurred in this section. Your data is safe.
              {process.env.NODE_ENV !== 'production' && this.state.error && (
                <><br /><br />
                  <code style={{ fontSize: '0.8rem', color: '#dc2626', wordBreak: 'break-all' }}>
                    {this.state.error.message}
                  </code>
                </>
              )}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 20px',
                  background: '#ea580c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '10px 20px',
                  background: '#fff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
