import { Component } from 'react';

export default class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page">
          <div className="empty-state">
            <h2>Something went wrong</h2>
            <p>{this.state.error.message || 'An unexpected error occurred'}</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => { this.setState({ error: null }); window.location.reload(); }}>
                Reload Page
              </button>
              <button className="btn-secondary" onClick={() => window.history.back()}>
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
