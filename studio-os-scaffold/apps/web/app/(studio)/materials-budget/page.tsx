import { StudioShell } from '../../../components/layout/StudioShell';
import { MaterialsBudgetScreen } from '../../../components/screens/MaterialsBudgetScreen';

export default function Page() {
  return (
    <StudioShell title="Materials & Budget">
      <MaterialsBudgetScreen />
    </StudioShell>
  );
}
