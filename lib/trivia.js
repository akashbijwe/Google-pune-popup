// Server-only: questions and answers never reach the browser until a question has been answered.
const BANK = [
  ['Which country is the world’s largest coffee producer?', ['Brazil', 'Vietnam', 'Italy', 'India'], 0],
  ['Where is coffee believed to have first been discovered?', ['Brazil', 'Ethiopia', 'Italy', 'Japan'], 1],
  ['What do you call a double shot of espresso?', ['Doppio', 'Lungo', 'Ristretto', 'Cortado'], 0],
  ['Coffee beans are actually the seeds of a…', ['Flower', 'Root', 'Fruit', 'Leaf'], 2],
  ['An Americano is espresso plus…', ['Cold milk', 'Hot water', 'Cream', 'Chocolate'], 1],
  ['A cappuccino is espresso with steamed milk and…', ['Ice', 'Milk foam', 'Lemon', 'Cream cheese'], 1],
  ['Which bean is generally smoother and sweeter?', ['Robusta', 'Arabica', 'Both the same', 'Neither'], 1],
  ['Cold brew is usually steeped for about…', ['30 minutes', '2 hours', '12–24 hours', '3 days'], 2],
  ['“Third wave” coffee treats coffee as…', ['A cheap commodity', 'An artisan craft', 'Only instant', 'A sweet dessert'], 1],
];
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

export function makeQuestions(n = 5) {
  return shuffle(BANK).slice(0, n).map(([q, opts, c]) => {
    const o = shuffle(opts.map((t, i) => ({ t, ok: i === c })));
    return { q, opts: o.map((x) => x.t), correct: o.findIndex((x) => x.ok) };
  });
}
