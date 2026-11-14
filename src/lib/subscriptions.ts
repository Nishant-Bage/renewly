export const categories = [
  "Entertainment",
  "Productivity",
  "Design",
  "Development",
  "Lifestyle",
] as const;
export type Category = (typeof categories)[number];
export type Subscription = {
  id: string;
  name: string;
  price: number;
  cycle: "monthly" | "yearly";
  category: Category;
  anchor: string;
  active: boolean;
};
export type Library = { version: 1; demo: boolean; items: Subscription[] };
export const storageKey = "renewly:v1";
export const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validate(item: Subscription) {
  if (
    !item ||
    typeof item.id !== "string" ||
    !item.id ||
    typeof item.name !== "string" ||
    !item.name.trim() ||
    item.name.length > 80 ||
    !Number.isFinite(item.price) ||
    item.price <= 0 ||
    item.price > 10000000 ||
    !["monthly", "yearly"].includes(item.cycle) ||
    !categories.includes(item.category) ||
    typeof item.anchor !== "string" ||
    !validDate(item.anchor) ||
    typeof item.active !== "boolean"
  )
    throw new Error(
      "Check the subscription name, price, category, billing cycle, and date.",
    );
  return item;
}
export function parseLibrary(raw: string): Library {
  const data = JSON.parse(raw);
  if (
    data.version !== 1 ||
    typeof data.demo !== "boolean" ||
    !Array.isArray(data.items) ||
    data.items.length > 1000
  )
    throw new Error("This backup is not a supported Renewly library.");
  const items = data.items.map(validate);
  if (new Set(items.map((i: Subscription) => i.id)).size !== items.length)
    throw new Error("Duplicate subscription IDs in backup.");
  return { version: 1, demo: data.demo, items };
}
export function monthly(item: Subscription) {
  return item.active ? item.price / (item.cycle === "yearly" ? 12 : 1) : 0;
}
// Calendar-based scheduling keeps the original billing day after short months.
export function nextRenewal(item: Subscription, from: string): string {
  const anchor = new Date(`${item.anchor}T00:00:00Z`);
  const start = new Date(`${from}T00:00:00Z`);
  if (anchor >= start) return item.anchor;
  const step = item.cycle === "yearly" ? 12 : 1;
  const distance =
    (start.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
    start.getUTCMonth() -
    anchor.getUTCMonth();
  let offset = Math.max(0, Math.floor(distance / step) * step);
  for (;;) {
    const month = new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + offset, 1),
    );
    const last = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
    ).getUTCDate();
    month.setUTCDate(Math.min(anchor.getUTCDate(), last));
    if (month >= start) return month.toISOString().slice(0, 10);
    offset += step;
  }
}
export function daysUntil(date: string, from: string) {
  return Math.round((Date.parse(date) - Date.parse(from)) / 86400000);
}
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(date));
}
export function sampleLibrary(date: string): Library {
  const rows: [string, number, Category, "monthly" | "yearly", number][] = [
    ["Netflix", 499, "Entertainment", "monthly", 2],
    ["Figma", 1200, "Design", "monthly", 5],
    ["Spotify", 119, "Entertainment", "monthly", 8],
    ["GitHub Pro", 3400, "Development", "yearly", 12],
    ["Notion", 800, "Productivity", "monthly", 17],
    ["iCloud+", 75, "Lifestyle", "monthly", 23],
  ];
  return {
    version: 1,
    demo: true,
    items: rows.map(([name, price, category, cycle, day], i) => {
      const d = new Date(`${date}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + day);
      return {
        id: `demo-${i}`,
        name,
        price,
        category,
        cycle,
        anchor: d.toISOString().slice(0, 10),
        active: true,
      };
    }),
  };
}
