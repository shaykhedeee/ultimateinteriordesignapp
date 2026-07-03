import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#020617] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h1 className="text-sm font-black uppercase tracking-widest text-red-400">Runtime error</h1>
            <pre className="text-[11px] text-slate-300 bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-auto whitespace-pre-wrap">
              {this.state.error?.message || String(this.state.error)}
            </pre>
            <pre className="text-[10px] text-slate-400 bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-auto whitespace-pre-wrap">
              {this.state.info?.componentStack}
            </pre>
            <button onClick={() => this.setState({ hasError: false, error: null, info: null })} className="mt-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 hover:border-[#D4AF37]">
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
