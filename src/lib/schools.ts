import type { CollectionEntry } from "astro:content";
import { slugify } from "./site";

export type SchoolEntry = CollectionEntry<"schools">;

export const boardingLabel: Record<SchoolEntry["data"]["boarding"], string> = {
  day: "Day",
  boarding: "Boarding",
  "day-and-boarding": "Day & Boarding",
};

export const genderLabel: Record<SchoolEntry["data"]["gender"], string> = {
  "co-ed": "Co-ed",
  boys: "Boys",
  girls: "Girls",
};

export function schoolTags(school: SchoolEntry["data"]): string[] {
  return [boardingLabel[school.boarding], genderLabel[school.gender], `Ages ${school.ageRange}`];
}

export function nationSlug(nation: string): string {
  return slugify(nation);
}

export function countySlug(county: string): string {
  return slugify(county);
}

export function schoolHref(school: SchoolEntry["data"]): string {
  return `/prep-schools/${school.slug}/`;
}

export function countyHref(nation: string, county: string): string {
  return `/${nationSlug(nation)}/${countySlug(county)}/`;
}

export function nationHref(nation: string): string {
  return `/${nationSlug(nation)}/`;
}

export function groupByCounty(schools: SchoolEntry[]): Map<string, { nation: string; county: string; schools: SchoolEntry[] }> {
  const map = new Map<string, { nation: string; county: string; schools: SchoolEntry[] }>();
  for (const school of schools) {
    const key = `${nationSlug(school.data.nation)}/${countySlug(school.data.county)}`;
    if (!map.has(key)) {
      map.set(key, { nation: school.data.nation, county: school.data.county, schools: [] });
    }
    map.get(key)!.schools.push(school);
  }
  return map;
}

export function uniqueCounties(schools: SchoolEntry[]): string[] {
  return [...new Set(schools.map((s) => s.data.county))].sort();
}

export function parseAgeRange(ageRange: string): { min: number; max: number } {
  const numbers = ageRange.match(/\d+/g)?.map(Number) ?? [];
  const min = numbers[0] ?? 0;
  const max = numbers[1] ?? numbers[0] ?? 18;
  return { min, max };
}
