import { StudioShell } from '../../../components/layout/StudioShell';
import { JobsScreen } from '../../../components/screens/JobsScreen';

export default function Page() {
  return (
    <StudioShell title="Jobs Monitor">
      <JobsScreen />
    </StudioShell>
  );
}
