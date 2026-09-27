export type MockTicket = {
  id: string;
  username: string;
  wine: string;
  winery: string;
  region: string;
  rating: number;
  review: string;
  tone: string;
};

export const mockTickets: MockTicket[] = [
  {
    id: "1",
    username: "maya.pours",
    wine: "2018 Cannubi Barolo",
    winery: "Luciano Sandrone",
    region: "Piedmont, Italy",
    rating: 5,
    review: "Tar, rose, and a long savory finish. The kind of bottle that makes a Tuesday feel like a cellar dinner.",
    tone: "linear-gradient(160deg, #4a1c22 0%, #8b3a3a 46%, #c9a27a 100%)",
  },
  {
    id: "2",
    username: "cellar.note",
    wine: "2021 Bandol Rosé",
    winery: "Domaine Tempier",
    region: "Provence, France",
    rating: 4,
    review: "Pale, saline, and a little wild. Provençal herbs over crushed strawberry — we drank it on the stoop.",
    tone: "linear-gradient(165deg, #d7a8a0 0%, #e8c4b0 48%, #f3e4c8 100%)",
  },
  {
    id: "3",
    username: "ridgewalker",
    wine: "2019 Lytton Springs",
    winery: "Ridge Vineyards",
    region: "Dry Creek Valley, California",
    rating: 5,
    review: "Zinfandel with a backbone. Dusty bramble, black pepper, and that Ridge honesty on the finish.",
    tone: "linear-gradient(155deg, #2c1612 0%, #6b2b22 50%, #b7794a 100%)",
  },
];
