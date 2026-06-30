import { StudioShell } from '../../../components/layout/StudioShell';
import { CommercialScreen } from '../../../components/screens/CommercialScreen';

export default function Page() {
  return (
    <StudioShell title="Production">
      <CommercialScreen title="Production" />
    </StudioShell>
  );
}
