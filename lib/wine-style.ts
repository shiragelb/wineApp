export type WineColor = "red" | "white" | "rose" | "orange";

export const WINE_COLORS: {
  id: WineColor;
  label: string;
  hint: string;
  from: string;
  to: string;
  ink: string;
}[] = [
  {
    id: "red",
    label: "Red",
    hint: "Barolo, Syrah, Cabernet",
    from: "#4a1820",
    to: "#9a3a3c",
    ink: "#f7e7d8",
  },
  {
    id: "white",
    label: "White",
    hint: "Chardonnay, Riesling",
    from: "#e8d9a8",
    to: "#f6f0d8",
    ink: "#3d2a18",
  },
  {
    id: "rose",
    label: "Rosé",
    hint: "Provence, pale and dry",
    from: "#d9898a",
    to: "#f3c7c0",
    ink: "#4a1820",
  },
  {
    id: "orange",
    label: "Orange",
    hint: "Skin contact, amber",
    from: "#c45c22",
    to: "#e8a05a",
    ink: "#2a1408",
  },
];

const RED_GRAPES =
  /nebbiolo|sangiovese|pinot noir|cabernet|merlot|syrah|shiraz|malbec|zinfandel|grenache|tempranillo|mourv[eè]dre|nerello|barbera|gamay|petite sirah|carignan|cinsault|montepulciano|aglianico|primitivo|carmenere|pinotage/;
const WHITE_GRAPES =
  /chardonnay|riesling|sauvignon|pinot grigio|pinot gris|viognier|chenin|gew[uü]rz|albarino|albariño|verdicchio|vermentino|gruner|muscadet|trebbiano|cortese|semillon|s[eé]millon|assyrtiko|godello|picpoul|melon/;

export function inferWineColor(input: {
  name?: string | null;
  grapes?: string | null;
  region?: string | null;
  color?: string | null;
}): WineColor {
  const stored = input.color?.toLowerCase().trim();
  if (stored === "red" || stored === "white" || stored === "rose" || stored === "rosé" || stored === "orange") {
    return stored === "rosé" ? "rose" : stored;
  }

  const blob = `${input.name ?? ""} ${input.grapes ?? ""} ${input.region ?? ""}`.toLowerCase();
  if (/ros[eé]|rosato|blush/.test(blob)) return "rose";
  if (/orange|amber|skin.?contact|ramato/.test(blob)) return "orange";
  if (/blanc|white|chardonnay|riesling|sauvignon|grigio/.test(blob) || WHITE_GRAPES.test(blob)) {
    return "white";
  }
  if (/rosso|rouge|tinto|barolo|barbaresco|chianti|bordeaux|burgundy|cabernet|syrah/.test(blob) || RED_GRAPES.test(blob)) {
    return "red";
  }
  return "red";
}

export function wineRegionGroup(region?: string | null) {
  if (!region?.trim()) return "Other";
  const parts = region.split(/[,/|]/).map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || region.trim();
}

export function colorMeta(id: WineColor) {
  return WINE_COLORS.find((color) => color.id === id) ?? WINE_COLORS[0];
}
