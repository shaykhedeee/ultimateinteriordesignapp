from pathlib import Path

p = Path('server/index.js')
text = p.read_text(encoding='utf-8')

marker = "app.get('/api/system/env-check', (req, res) => {"
insert = """app.get('/api/system/env-check', (req, res) => {
  res.json({
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    FREEPIK_API_KEY: !!process.env.FREEPIK_API_KEY,
    PEXELS_API_KEY: !!process.env.PEXELS_API_KEY,
    OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    HUGGINGFACE_API_KEY: !!process.env.HUGGINGFACE_API_KEY,
    IMAGINE_ART_API_KEY: !!process.env.IMAGINE_ART_API_KEY,
    GOOGLE_AI_STUDIO_KEY_1: !!process.env.GOOGLE_AI_STUDIO_KEY_1,
    LIVE_IMAGE_GEN: process.env.LIVE_IMAGE_GEN,
    IMAGE_PROVIDER: process.env.IMAGE_PROVIDER,
    AI_SPEND_MODE: process.env.AI_SPEND_MODE,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
  });
});

app.get('/api/system/demo-project', (req, res) => {
  const row = db.prepare("SELECT * FROM projects WHERE id = 'demo_proj_1'").get();
  if (row) return res.json(row);
  const projectId = 'demo_proj_1';
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO projects (id, name, client_name, email, phone, budget, unit_system, status, current_step, advance_paid_amount, total_cost, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    projectId, 'Demo Project', 'Demo Client', 'demo@example.com', '+91 99999 99999', 1000000, 'metric', 'brief_complete', 'brief', 0, 0, now
  );
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
  res.json(project);
});

app.post('/api/system/demo-project/brief', (req, res) => {
  const projectId = 'demo_proj_1';
  const brief = req.body && req.body.briefData ? req.body.briefData : { rooms: [{name: 'Living Room', type: 'living'}], lifestyle: 'standard' };
  db.prepare("UPDATE projects SET client_brief_json = ?, current_step = 'brief' WHERE id = ?").run(JSON.stringify(brief), projectId);
  if (req.body?.workspaceMode) {
    db.prepare("UPDATE projects SET status = 'brief_complete', current_step = 'cad' WHERE id = ?").run(projectId);
  }
  res.json({ success: true, projectId, mode: 'demo', brief });
});"""

if marker in text:
    text = text.replace(marker, insert)
    p.write_text(text, encoding='utf-8')
    print('system demo routes added')
else:
    print('missing env-check marker')
    raise SystemExit(1)
