import { StudioShell } from '../../../components/layout/StudioShell';
import { TimelineScreen } from '../../../components/screens/TimelineScreen';

export default function Page() {
  return (
    <StudioShell title="Activity Timeline">
      <TimelineScreen />
    </StudioShell>
  );
}
