import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '1rem',
            padding: '2rem',
            background: 'var(--tt-bg, #111827)',
            color: 'var(--tt-text, #f9fafb)',
            textAlign: 'center',
          }}
        >
          <AlertTriangle size={48} color="#F59E0B" strokeWidth={1.5} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Đã xảy ra lỗi không mong muốn</h2>
          <p style={{ color: 'var(--tt-text-muted, #9ca3af)', maxWidth: 420, fontSize: '0.9rem' }}>
            {this.state.error?.message || 'Lỗi không xác định'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              background: '#4772FA',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <RefreshCw size={15} />
            Thử lại
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              fontSize: '0.8rem',
              color: 'var(--tt-text-muted, #9ca3af)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
