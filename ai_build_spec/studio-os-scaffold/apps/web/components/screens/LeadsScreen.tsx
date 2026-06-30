'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { Panel } from '../primitives/Panel';

type Lead = {
  id: string;
  contactName: string;
  phone?: string;
  city?: string;
  source: string;
  status: string;
  budgetBand?: string;
};

export function LeadsScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contactName, setContactName] = useState('');
  const [source, setSource] = useState('walk_in');
  const [city, setCity] = useState('');
  const [budgetBand, setBudgetBand] = useState('standard');

  async function load() {
    const data = await apiGet<Lead[]>('/leads');
    setLeads(data);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiPost('/leads', { contactName, source, city, budgetBand });
    setContactName('');
    setCity('');
    await load();
  }

  async function qualifyLead(leadId: string) {
    await apiPost(`/leads/${leadId}/qualify`, {});
    await load();
  }

  return (
    <div className="workspace3">
      <Panel title="Create Lead">
        <form onSubmit={handleSubmit} className="listMock">
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Client name" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="walk_in">Walk-in</option>
            <option value="instagram">Instagram</option>
            <option value="referral">Referral</option>
          </select>
          <select value={budgetBand} onChange={(e) => setBudgetBand(e.target.value)}>
            <option value="economy">Economy</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="luxury">Luxury</option>
          </select>
          <button type="submit">Create Lead</button>
        </form>
      </Panel>
      <Panel title="Leads">
        <div className="listMock">
          {leads.map((lead) => (
            <div className="rowMock" key={lead.id}>
              <strong>{lead.contactName}</strong>
              <div className="muted">{lead.city} · {lead.source} · {lead.budgetBand} · {lead.status}</div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => qualifyLead(lead.id)}>Qualify Lead</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Lead Process Notes">
        <div className="listMock">
          <div className="rowMock">Capture decision-maker and move-in date early.</div>
          <div className="rowMock">Estimate fit before over-designing the project.</div>
          <div className="rowMock">Move qualified leads into intake quickly.</div>
        </div>
      </Panel>
    </div>
  );
}
