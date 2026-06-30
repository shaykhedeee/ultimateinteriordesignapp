import { StudioShell } from '../../../components/layout/StudioShell';
import { CommandCenterScreen } from '../../../components/screens/CommandCenterScreen';

export default function Page() {
  return (
    <StudioShell title="Command Center">
      <CommandCenterScreen />
    </StudioShell>
  );
}
