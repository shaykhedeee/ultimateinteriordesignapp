import React, { useCallback, useEffect, useMemo, useState } from 'react';

export default function FurnitureCatalogScreen({ projectId }) {
  const [families, setFamilies] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [placingFamily, setPlacingFamily] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vendorMaterials, setVendorMaterials] = useState([]);
  const [vendorLoading, setVendorLoading] = useState(false);

  const loadMaterialCategories = useCallback((rows) => {
    const counts = {};
    (rows || []).forEach((row) => {
      const cat = row.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    setCategories(Object.keys(counts).sort());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch('http://127.0.0.1:5055/api/catalog/furniture-families').then((r) => r.json()),
      fetch('http://127.0.0.1:5055/api/catalog/materials').then((r) => r.json()),
    ])
      .then(([famData, matData]) => {
        if (cancelled) return;
        setFamilies(Array.isArray(famData) ? famData : []);
        const matRows = Array.isArray(matData) ? matData : [];
        setMaterials(matRows);
        loadMaterialCategories(matRows);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load catalog.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadMaterialCategories]);

  useEffect(() => {
    let cancelled = false;
    setVendorLoading(true);
    setVendorMaterials([]);
    if (!selectedBrand) {
      setVendorLoading(false);
      return () => {
        cancelled = true;
      };
    }
    fetch(`http://127.0.0.1:5055/api/brands/${encodeURIComponent(selectedBrand)}/materials`)
      .then((r) => r.json())
      .then((rows) => {
        if (!cancelled) setVendorMaterials(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load vendor materials.');
      })
      .finally(() => {
        if (!cancelled) setVendorLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBrand]);

  const filteredFamilies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return families.filter((family) => {
      if (selectedCategory && family.category !== selectedCategory) return false;
      if (q) {
        const haystack = [
          family.label || '',
          family.category || '',
          (family.styleTags || []).join(' '),
          (family.trendTags || []).join(' '),
          (family.roomTypes || []).join(' '),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [families, selectedCategory, search]);

  const uniqueCategories = useMemo(() => {
    const map = new Map();
    families.forEach((family) => {
      const cat = family.category || 'other';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [families]);

  async function handleAddToProject(family) {
    if (!projectId) {
      setError('Select a project before adding catalog items.');
      return;
    }
    setPlacingFamily(family);
    setSuccess('');
    setError('');
    try {
      const familyPlacementType = family.placementType || 'floor';
      const payload = {
        familyKey: family.key,
        x: 120,
        y: 120,
        rotation: 0,
        materialZoneAssignments: {},
        placementType: familyPlacementType,
      };
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/catalog/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add item to project scene.');
      const data = await res.json();
      setSuccess(`${family.label || family.key} added to project scene.`);
      return data.item;
    } catch (err) {
      setError(err.message || 'Add failed.');
    } finally {
      setPlacingFamily(null);
    }
  }

  const [bomSummary, setBomSummary] = useState(null);
  const [bomSummaryLoading, setBomSummaryLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setBomSummaryLoading(true);
    fetch(`http://127.0.0.1:5055/api/projects/${projectId}/budget/summary`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data && data.success) setBomSummary(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBomSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <div className="h-full w-full overflow-y-auto text-left space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">Bill of Materials</h3>
          <p className="text-[10px] text-slate-500">Geometry-derived line items with live cost estimates.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {bomSummaryLoading && <span className="text-[10px] font-mono text-slate-500">Updating estimate...</span>}
          {bomSummary && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-[10px] font-mono text-slate-300">
              <span className="text-slate-500">Est. Cost</span>
              <span className="text-[#D4AF37] font-black">₹{Number(bomSummary.totalEstimatedCost || 0).toLocaleString()}</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-500">Items</span>
              <span className="text-slate-100 font-black">{bomSummary.itemCount || 0}</span>
            </div>
          )}
          {!projectId && (
            <span className="text-[10px] text-slate-500">Open a project to load BOM.</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-3">
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Families</div>
              <span className="text-[10px] font-mono text-slate-500">{filteredFamilies.length} shown</span>
            </div>
            {loading ? (
              <div className="text-[11px] text-slate-400">Loading catalog...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredFamilies.map((family) => (
                  <div key={family.key} className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-bold text-slate-200">{family.label || family.key}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          {family.category} · {family.placementType || 'floor'} · snap {family.snapOrigin || 'center'}
                        </div>
                      </div>
                      <span className="mt-0.5 rounded-full border border-slate-800 bg-slate-900 px-2 py-0.5 text-[9px] font-black uppercase text-slate-300">{family.priceBand || 'standard'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(family.roomTypes || []).slice(0, 3).map((room) => (
                        <span key={room} className="rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">{room}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">₹{family.price ? family.price.toLocaleString() : '0'}</span>
                      <button
                        onClick={() => handleAddToProject(family)}
                        disabled={!projectId || placingFamily === family}
                        className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 rounded-lg text-[10px] font-black uppercase disabled:opacity-40"
                      >
                        {placingFamily === family ? 'Adding...' : 'Add to project'}
                      </button>
                    </div>
                  </div>
                ))}
                {filteredFamilies.length === 0 && <div className="text-[11px] text-slate-500">No families match filters.</div>}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Materials</div>
              {loading && <span className="text-[10px] font-mono text-slate-500">Loading...</span>}
            </div>
            {loading ? (
              <div className="text-[11px] text-slate-400">Loading materials...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2"
                    aria-label={`${material.name} material`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-bold text-slate-200">{material.name}</div>
                        <div className="text-[9px] text-slate-500 font-mono">vendor {material.vendorId}</div>
                      </div>
                      <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-0.5 text-[9px] font-black text-[#D4AF37]">
                        ₹{Number(material.pricePerSquareFoot || 0).toFixed(0)}/sqft
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(Array.isArray(material.tags) ? material.tags : []).slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {materials.length === 0 && <div className="text-[11px] text-slate-500">No materials available.</div>}
              </div>
            )}
          </div>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Materials by Brand</div>
              {vendorLoading && <span className="text-[10px] font-mono text-slate-500">Loading...</span>}
            </div>
            <label className="block space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Brand</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                aria-label="Filter materials by brand"
              >
                <option value="">Select brand</option>
                {Array.from(new Set(materials.map((m) => m.brand))).sort().map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </label>
            {selectedBrand ? (
              <div className="space-y-1 max-h-[220px] overflow-y-auto" aria-live="polite">
                {vendorLoading ? (
                  <div className="text-[11px] text-slate-400">Loading brand materials...</div>
                ) : (
                  vendorMaterials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5" aria-label={`${material.name} material`}>
                      <div>
                        <div className="text-[11px] font-bold text-slate-200">{material.name}</div>
                        <div className="text-[9px] text-slate-500">vendor {material.vendorId}</div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">₹{Number(material.pricePerSquareFoot || 0).toFixed(0)}/sqft</span>
                    </div>
                  ))
                )}
                {!vendorLoading && vendorMaterials.length === 0 && <div className="text-[11px] text-slate-500">No materials for this brand.</div>}
              </div>
            ) : (
              <div className="text-[10px] text-slate-500">Select a brand to explore its material library.</div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="text-[10px] text-red-400 font-mono">{error}</div>}
      {success && <div className="text-[10px] text-emerald-400 font-mono">{success}</div>}
    </div>
  );
}
