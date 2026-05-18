/**
 * Loads school profiles from the pipeline output directory at build time.
 *
 * One JSON file per school at <repo>/data/processed/schools/<cds>.json,
 * where cds is the 14-digit dashed code "CC-DDDDD-SSSSSSS". School data is
 * all-students-with-disabilities only (no autism split below district level).
 * Server-component only — fs reads happen at build time.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { SchoolProfile } from "./types";

const SCHOOLS_DIR = path.resolve(process.cwd(), "../../data/processed/schools");

export async function listSchoolCdsCodes(): Promise<string[]> {
  const entries = await fs.readdir(SCHOOLS_DIR);
  return entries.filter((e) => e.endsWith(".json")).map((e) => e.replace(/\.json$/, "")).sort();
}

export async function loadSchool(cds: string): Promise<SchoolProfile | null> {
  try {
    const raw = await fs.readFile(path.join(SCHOOLS_DIR, `${cds}.json`), "utf-8");
    return JSON.parse(raw) as SchoolProfile;
  } catch {
    return null;
  }
}

export async function loadAllSchools(): Promise<SchoolProfile[]> {
  const codes = await listSchoolCdsCodes();
  const profiles = await Promise.all(codes.map(loadSchool));
  return profiles.filter((p): p is SchoolProfile => p !== null);
}

/** Schools belonging to one district, alphabetical by name. */
export async function loadSchoolsForDistrict(districtCds: string): Promise<SchoolProfile[]> {
  const all = await loadAllSchools();
  return all
    .filter((s) => s.district_cds === districtCds)
    .sort((a, b) => a.name.localeCompare(b.name));
}
