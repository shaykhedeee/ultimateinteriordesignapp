export function useJobPolling(projectId, options = {}) {
  const { intervalMs = 1200, maxAgeMs = 10 * 60 * 1000 } = options;
  const [job, setJob] = useState(null);
  const [status, setStatus] = useState('idle');
  const timerRef = useRef(null);
  const startRef = useRef(null);

  const start = useCallback((initial = {}) => {
    setJob(initial);
    setStatus('running');
    startRef.current = Date.now();
  }, []);

  const poll = useCallback(async (jobId) => {
    if (!jobId || !projectId) return;
    if (startRef.current && Date.now() - startRef.current > maxAgeMs) {
      setStatus('timeout');
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    try {
      const res = await fetch(`${getApiBase()}/api/projects/${projectId}/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        const current = data?.job || data;
        setJob(current);
        const s = current?.status || current?.state || 'unknown';
        if (s === 'succeeded' || s === 'failed' || s === 'cancelled') {
          setStatus(s);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }
    } catch {
      // keep polling on transient errors
    }
  }, [projectId]);

  useEffect(() => {
    if (status === 'running' && job?.id) {
      poll(job.id);
      timerRef.current = setInterval(() => poll(job.id), intervalMs);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [status, job?.id, poll, intervalMs]);

  return { job, status, start, poll, reset: () => { setJob(null); setStatus('idle'); if (timerRef.current) clearInterval(timerRef.current); } };
}
