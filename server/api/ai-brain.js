const express = require('express');
const router = express.Router();
const os = require('os');

const brain = {
  startedAt: Date.now(),
  status: 'idle',
  lastActivity: null,
  events: [],
  trainers: {
    tiny_llm_trainer: { runCount: 0, lastError: null, running: false }
  }
};

router.get('/status', (req, res) => {
  const uptimeSec = Math.max(0, Math.round((Date.now() - brain.startedAt) / 1000));
  res.json({
    status: brain.status,
    uptimeSec,
    machine: {
      cpus: os.cpus().length,
      totalMemGb: Math.round((os.totalmem() / 1024 / 1024 / 1024) * 10) / 10,
      platform: os.platform(),
    },
    lastActivity: brain.lastActivity,
    trainers: brain.trainers,
    events: brain.events.slice(-20),
  });
});

router.post('/train/tiny-llm/start', (req, res) => {
  const t = brain.trainers.tiny_llm_trainer;
  t.running = true;
  t.lastError = null;
  t.runCount += 1;
  brain.status = 'training';
  brain.lastActivity = new Date().toISOString();
  brain.events.push({ type: 'trainer.start', ts: brain.lastActivity });
  res.json({ status: 'started', trainer: 'tiny_llm_trainer', runCount: t.runCount });
});

router.post('/train/tiny-llm/stop', (req, res) => {
  const t = brain.trainers.tiny_llm_trainer;
  t.running = false;
  brain.status = 'idle';
  brain.lastActivity = new Date().toISOString();
  brain.events.push({ type: 'trainer.stop', ts: brain.lastActivity });
  res.json({ status: 'stopped' });
});

router.post('/events', (req, res) => {
  const event = req.body || {};
  brain.events.push({ receivedAt: new Date().toISOString(), ...event });
  brain.lastActivity = new Date().toISOString();
  if (brain.events.length > 200) brain.events = brain.events.slice(-200);
  res.json({ queued: brain.events.length });
});

module.exports = router;
