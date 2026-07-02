import { useMemo, useState, useEffect, useCallback } from 'react';

export default function BudgetAndBomScreen({ projectId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format;
    } catch {
      return (value) => `₹${Number(value || 0).toFixed(0)}`;
    }
  }, []);

  const [benchmark, setBenchmark] = useState(null);
  const loadBenchmark = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/benchmark`);
      const data = await res.json();
      if (res.ok && data?.success) setBenchmark(data);
    } catch {}
  }, [projectId]);

  useEffect(() => { loadBenchmark(); }, [loadBenchmark]);

  const loadBom = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/projects/${projectId}/bom`);
      const text = await response.text();
      const parsed = text ? JSON.parse(text) : {};
      if (!response.ok) {
        const message = (parsed && (parsed.message || parsed.error)) || 'BOM request failed';
        throw new Error(message);
      }
      const list = Array.isArray(parsed?.bom) ? parsed.bom : Array.isArray(parsed) ? parsed : [];
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load BOM');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadBom();
  }, [loadBom]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredItems = items.filter((item) => {
    const label = (item.catalogKey || item.displayName || item.name || '').toLowerCase();
    return label.includes(normalizedQuery);
  });

  const tableTotals = useMemo(() => {
    let count = 0;
    let subtotal = 0;
    for (const item of filteredItems) {
      count += Number(item.qty || 0);
      const lineTotal = Number(item.qty || 0) * Number(item.unitPrice || 0);
      subtotal += isNaN(lineTotal) ? 0 : lineTotal;
    }
    return { count, subtotal };
  }, [filteredItems]);

  return (
    <section className="budget-bom-screen" aria-labelledby="bom-heading">
      <header className="budget-bom-header">
        <h2 id="bom-heading">Bill of Materials</h2>
        <div className="budget-bom-actions">
          <label htmlFor="bom-search" className="sr-only">
            Search BOM items
          </label>
          <input
            id="bom-search"
            aria-label="Search BOM items"
            placeholder="Search items..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            aria-label="Refresh bill of materials"
            onClick={loadBom}
            disabled={!projectId || loading}
          >
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <p className="bom-error" role="alert">
          {error}
        </p>
      )}

      {benchmark && (
        <div className="budget-benchmark-strip" aria-live="polite">
          <div className="benchmark-kpi grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[9px] uppercase tracking-wider font-black text-slate-500">Actual Cost</div>
              <div className="text-sm font-black text-slate-100">{currencyFormatter(benchmark.benchmark?.actualTotal || 0)}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[9px] uppercase tracking-wider font-black text-slate-500">Benchmark</div>
              <div className="text-sm font-black text-slate-100">{currencyFormatter(benchmark.benchmark?.benchmarkTotal || 0)}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[9px] uppercase tracking-wider font-black text-slate-500">Affordability</div>
              <div className={`text-xs font-black ${(benchmark.benchmark?.varianceTotal || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {(benchmark.benchmark?.status === 'under-budget' ? 'Under Budget' : benchmark.benchmark?.status === 'over-budget' ? 'Over Budget' : 'Unknown')} · {currencyFormatter(Math.abs(benchmark.benchmark?.varianceTotal || 0))}
              </div>
            </div>
          </div>
          <div className="mt-2 text-[9px] text-slate-500">Benchmark mode: {benchmark.lines?.[0]?.source || 'draft'}</div>
        </div>
      )}

      {loading && !items.length ? (
        <p aria-live="polite">Loading bill of materials...</p>
      ) : (
        <div className="budget-bom-table-wrap">
          <table aria-labelledby="bom-heading">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Qty</th>
                <th scope="col">Unit Price</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {!filteredItems.length ? (
                <tr>
                  <td colSpan={4}>
                    {loading ? 'Loading bill of materials...' : 'No BOM items yet. Use Design Studio or Quick Layout to place items, then refresh.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const label = item.displayName || item.catalogKey || item.name || `Item ${index + 1}`;
                  const qty = Number(item.qty || 0);
                  const unitPrice = Number(item.unitPrice || 0);
                  const total = isNaN(qty) || isNaN(unitPrice) ? NaN : qty * unitPrice;

                  return (
                    <tr key={`${label}-${index}`}>
                      <td>{label}</td>
                      <td>{isNaN(qty) ? '-' : qty}</td>
                      <td>{isNaN(unitPrice) ? '-' : currencyFormatter(unitPrice)}</td>
                      <td>{isNaN(total) ? '-' : currencyFormatter(total)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td>Summary</td>
                <td>{tableTotals.count}</td>
                <td>-</td>
                <td>{currencyFormatter(tableTotals.subtotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
