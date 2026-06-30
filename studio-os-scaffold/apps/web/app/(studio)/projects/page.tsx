import { StudioShell } from '../../../components/layout/StudioShell';
import { ProjectsScreen } from '../../../components/screens/ProjectsScreen';

export default function Page() {
  return (
    <StudioShell title="Projects">
      <ProjectsScreen />
    </StudioShell>
  );
}
