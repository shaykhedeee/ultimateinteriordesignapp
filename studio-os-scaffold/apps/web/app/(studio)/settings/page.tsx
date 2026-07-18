import { StudioShell } from '../../../components/layout/StudioShell';
import { Panel } from '../../../components/primitives/Panel';

export default function Page() {
  return (
    <StudioShell title="Settings">
      <Panel title="Settings">
        <div className="canvasMock">Settings screen scaffold.</div>
      </Panel>
    </StudioShell>
  );
}
