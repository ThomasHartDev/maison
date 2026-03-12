import type { Dress, Quantities, Size } from "@/types";

export const uid = (): string => Math.random().toString(36).slice(2, 10);

export const sum = (o: Record<string, number>): number =>
  Object.values(o).reduce((a, b) => a + b, 0);

export const daysUntil = (d: string): number =>
  Math.ceil((new Date(d).getTime() - new Date().getTime()) / 864e5);

export const fmtDate = (d: string): string => {
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return d;
  }
};

export const nowISO = (): string => new Date().toISOString().split("T")[0];

export const nowTime = (): string =>
  new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

export const qM = (xs: number, s: number, m: number, l: number, xl: number, xxl: number): Quantities =>
  ({ XS: xs, S: s, M: m, L: l, XL: xl, XXL: xxl });

export function matchDress(text: string, dresses: Dress[]): string[] {
  const low = text.toLowerCase();
  return dresses
    .filter(d => low.includes(d.name.toLowerCase()) || low.includes(d.poNumber.toLowerCase()))
    .map(d => d.id);
}
