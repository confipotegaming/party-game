// API du back-office du Grand Sondage, montée par le moteur sur /api/games/sondage.
// Accès : si la variable d'environnement ADMIN_TOKEN est définie, l'en-tête « x-admin-token » doit la fournir ;
// sinon l'API n'est accessible que depuis la machine qui héberge le jeu (localhost).
const express = require('express');
const cfg = require('./config');
const { store, ValidationError, sanitize } = require('./store');
const importer = require('./importer');
const { compile, match } = require('./matcher');

const router = express.Router();
router.use(express.json({ limit: '2mb' }));

const LOCAL = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
router.use((req, res, next) => {
  const token = process.env.ADMIN_TOKEN;
  const ok = token ? req.get('x-admin-token') === token : LOCAL.has(req.socket.remoteAddress);
  if (!ok) return res.status(403).json({ error: token ? 'Jeton d’administration invalide.' : 'Back-office accessible uniquement depuis l’ordinateur hôte (ou définissez ADMIN_TOKEN).' });
  next();
});

// Erreurs dues aux données envoyées (400) plutôt qu'au serveur (500).
const userError = (err) => err instanceof ValidationError || err instanceof SyntaxError || err.code === 'ERR_INVALID_URL'
  || err.name === 'TimeoutError' || err.message === 'fetch failed';
const handle = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (err) {
    if (userError(err)) return res.status(400).json({ error: err.message === 'fetch failed' ? 'Source injoignable.' : err.message });
    console.error('[sondage:admin]', err);
    res.status(500).json({ error: 'Erreur interne.' });
  }
};

router.get('/meta', (req, res) => res.json({
  categories: store.categories(),
  difficulties: Object.entries(cfg.DIFFICULTIES).map(([id, d]) => ({ id, ...d })),
  rounds: cfg.ROUNDS, maxStrikes: cfg.MAX_STRIKES, count: store.list().length,
}));

router.get('/questions', (req, res) => res.json(store.list(req.query)));
router.get('/questions/:id', (req, res) => { const q = store.get(req.params.id); q ? res.json(q) : res.status(404).json({ error: 'Question introuvable.' }); });
router.post('/questions', handle((req, res) => res.status(201).json(store.create(req.body))));
router.put('/questions/:id', handle((req, res) => { const q = store.update(req.params.id, req.body); q ? res.json(q) : res.status(404).json({ error: 'Question introuvable.' }); }));
router.patch('/questions/:id/active', handle((req, res) => { const q = store.setActive(req.params.id, req.body && req.body.active); q ? res.json(q) : res.status(404).json({ error: 'Question introuvable.' }); }));
router.delete('/questions/:id', (req, res) => (store.remove(req.params.id) ? res.status(204).end() : res.status(404).json({ error: 'Question introuvable.' })));

// Import : { format: 'json'|'csv'|'', content } ou { url }, mode 'skip' (défaut) ou 'replace'.
router.post('/import', handle(async (req, res) => {
  const { content, format, url, mode } = req.body || {};
  const list = url ? await importer.fetchUrl(url) : importer.parse(String(content || ''), format);
  res.json(store.importMany(list, { mode }));
}));
router.get('/export', (req, res) => {
  res.set('Content-Disposition', 'attachment; filename="sondage-questions.json"');
  res.json(store.exportAll());
});

// Teste une proposition contre une question (pour régler les variantes depuis le back-office).
router.post('/test-match', handle((req, res) => {
  const { question, guess } = req.body || {};
  const q = sanitize(question);
  const m = match(compile(q.answers, store.synonyms()), guess);
  res.json(m && !m.ambiguous ? { found: true, answer: q.answers[m.index].answer, score: m.score }
    : { found: false, ambiguous: !!(m && m.ambiguous), answers: m && m.ambiguous ? m.indexes.map(i => q.answers[i].answer) : [] });
}));

module.exports = router;
