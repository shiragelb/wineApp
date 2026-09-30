export type WineType =
  | "red"
  | "white"
  | "rosé"
  | "sparkling"
  | "orange"
  | "fortified"
  | "dessert";

export type GrapeShare = {
  grape: string;
  percentage: number | null;
};

export type WineryRow = {
  id: string;
  name: string;
  country: string | null;
  country_code: string | null;
  region: string | null;
};

export const WINE_TYPES: {
  id: WineType;
  label: string;
  colorClass: string;
  browseColor?: "red" | "white" | "rose" | "orange";
}[] = [
  { id: "red", label: "Red", colorClass: "bg-[#7a2e2a]/12 text-[#7a2e2a]", browseColor: "red" },
  { id: "white", label: "White", colorClass: "bg-[#c9a84c]/18 text-[#6a5220]", browseColor: "white" },
  { id: "rosé", label: "Rosé", colorClass: "bg-[#d9898a]/18 text-[#8a3a42]", browseColor: "rose" },
  { id: "sparkling", label: "Sparkling", colorClass: "bg-[#8aa4b8]/18 text-[#3a5160]" },
  { id: "orange", label: "Orange", colorClass: "bg-[#c45c22]/15 text-[#8a3a10]", browseColor: "orange" },
  { id: "fortified", label: "Fortified", colorClass: "bg-[#5c3a28]/12 text-[#5c3a28]" },
  { id: "dessert", label: "Dessert", colorClass: "bg-[#b07030]/15 text-[#6a4018]" },
];

export const COMMON_GRAPES = [
  "Nebbiolo",
  "Sangiovese",
  "Cabernet Sauvignon",
  "Merlot",
  "Pinot Noir",
  "Chardonnay",
  "Sauvignon Blanc",
  "Riesling",
  "Syrah",
  "Grenache",
  "Mourvèdre",
  "Cinsault",
  "Tempranillo",
  "Malbec",
  "Zinfandel",
  "Barbera",
  "Gamay",
  "Traminer",
  "Gewürztraminer",
  "Grüner Veltliner",
  "Pinot Gris",
  "Chenin Blanc",
  "Viognier",
  "Albariño",
  "Vermentino",
  "Blaufränkisch",
  "Zweigelt",
  "Field Blend",
] as const;

const BLEND_PALETTE = [
  "#7A2E2A",
  "#C9A84C",
  "#D9898A",
  "#C45C22",
  "#3A5160",
  "#5C3A28",
  "#6A8F6A",
  "#8A5A8A",
];

export function normalizeWineType(value?: string | null): WineType | null {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  if (raw === "rose" || raw === "rosé") return "rosé";
  if (
    raw === "red" ||
    raw === "white" ||
    raw === "sparkling" ||
    raw === "orange" ||
    raw === "fortified" ||
    raw === "dessert"
  ) {
    return raw;
  }
  return null;
}

export function wineTypeToBrowseColor(type?: string | null): "red" | "white" | "rose" | "orange" | null {
  const normalized = normalizeWineType(type);
  if (!normalized) return null;
  if (normalized === "rosé") return "rose";
  if (normalized === "red" || normalized === "white" || normalized === "orange") return normalized;
  if (normalized === "sparkling") return "white";
  if (normalized === "fortified" || normalized === "dessert") return "red";
  return null;
}

export function browseColorToWineType(
  color?: string | null
): WineType | null {
  if (!color) return null;
  if (color === "rose") return "rosé";
  if (color === "red" || color === "white" || color === "orange") return color;
  return null;
}

export function parseGrapeShares(
  value: unknown
): GrapeShare[] {
  if (!value) return [];
  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((grape, _index, all) => ({
        grape,
        percentage: all.length === 1 ? 100 : null,
      }));
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const grape =
        typeof record.grape === "string"
          ? record.grape.trim()
          : typeof record.name === "string"
            ? record.name.trim()
            : "";
      if (!grape) return null;
      const percentageRaw = record.percentage;
      const percentage =
        typeof percentageRaw === "number" && Number.isFinite(percentageRaw)
          ? Math.max(0, Math.min(100, Math.round(percentageRaw)))
          : percentageRaw === null
            ? null
            : null;
      return { grape, percentage };
    })
    .filter((item): item is GrapeShare => Boolean(item));
}

export function grapesToLegacyText(shares: GrapeShare[]) {
  return shares.map((share) => share.grape).filter(Boolean).join(", ") || null;
}

export function formatGrapeLabel(shares: GrapeShare[]) {
  if (shares.length === 0) return null;
  if (shares.length === 1) {
    const only = shares[0];
    if (only.percentage == null) return only.grape;
    return `${only.percentage}% ${only.grape}`;
  }

  const named = shares.map((share) => share.grape).join(" / ");
  const percents = shares
    .map((share) => share.percentage)
    .filter((value): value is number => typeof value === "number");
  if (percents.length === shares.length) {
    const initials = shares
      .map((share) =>
        share.grape
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
      )
      .join("");
    const blendName =
      shares.length <= 4 && initials.length <= 6 ? `${initials} Blend` : "Blend";
    return `${blendName} (${percents.join("/")})`;
  }
  if (shares.some((share) => /field blend|local/i.test(share.grape))) {
    return "Local / Field Blend";
  }
  return named;
}

export function grapeBlendTotal(shares: GrapeShare[]) {
  return shares.reduce((sum, share) => sum + (share.percentage ?? 0), 0);
}

export function isFieldBlend(shares: GrapeShare[]) {
  return shares.length === 1 && /field blend|local/i.test(shares[0]?.grape ?? "");
}

export function grapeBandColor(grape: string, index: number) {
  let hash = 0;
  for (let i = 0; i < grape.length; i += 1) {
    hash = (hash * 31 + grape.charCodeAt(i)) >>> 0;
  }
  return BLEND_PALETTE[(hash + index) % BLEND_PALETTE.length];
}

export function countryFlag(countryCode?: string | null) {
  const code = countryCode?.trim().toUpperCase();
  if (!code || code.length !== 2 || !/^[A-Z]{2}$/.test(code)) return null;
  const chars = [...code].map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...chars);
}

export function wineOriginLine(input: {
  country?: string | null;
  countryCode?: string | null;
  region?: string | null;
  winery?: string | null;
}) {
  const flag = countryFlag(input.countryCode);
  const country = input.country?.trim() || null;
  const region = input.region?.trim() || null;
  const winery = input.winery?.trim() || null;
  const parts = [country, region, winery].filter(Boolean);
  if (parts.length === 0) return null;
  return `${flag ? `${flag} ` : ""}${parts.join(" • ")}`;
}

export function wineTypeMeta(type?: string | null) {
  const normalized = normalizeWineType(type);
  return WINE_TYPES.find((item) => item.id === normalized) ?? null;
}

export function explorePath(params: {
  winery?: string | null;
  region?: string | null;
  grape?: string | null;
  type?: string | null;
}) {
  const query = new URLSearchParams();
  if (params.winery) query.set("winery", params.winery);
  if (params.region) query.set("region", params.region);
  if (params.grape) query.set("grape", params.grape);
  if (params.type) query.set("type", params.type);
  const qs = query.toString();
  return qs ? `/explore?${qs}` : "/explore";
}
