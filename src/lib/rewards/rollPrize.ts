export type Prize = {
  key: string;
  label: string;
  weight: number;
  points?: number;
};

export const PRIZES: Prize[] = [
  { key: "50_pts", label: "50 pts", weight: 28, points: 50 },
  { key: "100_pts", label: "100 pts", weight: 18, points: 100 },
  { key: "5_off", label: "$5 OFF", weight: 10 },
  { key: "free_dessert", label: "Free Dessert", weight: 4 },
  { key: "try_again", label: "Try Again", weight: 40 },
];

export function rollPrize() {
  let t = PRIZES.reduce((a, p) => a + p.weight, 0);
  let r = Math.random() * t;
  for (const p of PRIZES) {
    if (r < p.weight) return p;
    r -= p.weight;
  }
  return PRIZES[PRIZES.length - 1];
}