'use client';

import { MaterialsCatalogScreen } from './MaterialsCatalogScreen';
import { CommercialScreen } from './CommercialScreen';

export function MaterialsBudgetScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <MaterialsCatalogScreen />
      <CommercialScreen title="Budget Engine" />
    </div>
  );
}
