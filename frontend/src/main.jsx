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

(function initAppMonitor() {
  try {
    const root = document.getElementById('root');
    const fallback = document.getElementById('app-fallback');
    const fallbackMessage = document.getElementById('app-fallback-message');
    const appFallback = typeof fallback !== 'undefined' ? fallback : null;

    window.__reloadApp = () => {
      if (!root) return;
      try {
        root.innerHTML = '';
        createRoot(root).render(App);
      } catch (e) {
        if (fallbackMessage) fallbackMessage.textContent = e && (e.message || String(e));
        if (appFallback) { appFallback.classList.remove('hidden'); appFallback.classList.add('flex'); }
      }
    };

    const showFallback = (message) => {
      if (fallbackMessage && typeof fallbackMessage.textContent !== 'undefined') fallbackMessage.textContent = message || 'App did not render. Check console for details.';
      if (appFallback) { appFallback.classList.remove('hidden'); appFallback.classList.add('flex'); }
    };

    setTimeout(() => {
      if (!root || (!root.children || !root.children.length)) {
        showFallback('React root did not mount within 4 seconds.');
      }
      const fb = document.getElementById('diag-mount');
      if (!fb) {
        const el = document.createElement('div');
        el.id = 'diag-mount';
        el.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#020617;color:#F0EEE8;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;padding:16px;overflow:auto;';
        el.innerHTML = '<b>DEV DIAGNOSTIC</b><br>root=' + (!root ? 'null' : 'present') + '<br>rootChildren=' + (root ? (root.children ? root.children.length : 'null') : 'null') + '<br>rootHTML=' + (root ? (root.innerHTML.length + ' chars') : 'null') + '<br>documentState=' + document.readyState + '<br>reactRenderers=' + (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ? window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size : 'no-hook') + '<br>lastScript=' + document.querySelectorAll('script[type=module]').length;
        document.body.appendChild(el);
      }
    }, 4000);

    window.addEventListener('error', (event) => {
      showFallback(event.message || 'Runtime error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason && (event.reason.message || typeof event.reason === 'string' ? event.reason : JSON.stringify(event.reason));
      showFallback(reason || 'Unhandled promise rejection');
    });
  } catch (e) {
    console.error('[AppMonitor] init failed', e);
  }
})();
