// Format compact des questions de démonstration : [réponse, votes, 'variante|variante|…'] → format d'import standard.
module.exports = (category) => (question, difficulty, answers) => ({
  question, category, difficulty, language: 'fr', active: true,
  answers: answers.map(([answer, votes, variants = ''], i) => ({ answer, votes, position: i + 1, accepted_variants: variants ? variants.split('|') : [] })),
});
