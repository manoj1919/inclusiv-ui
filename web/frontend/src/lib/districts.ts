/**
 * Loads district profiles from the pipeline output directory at build time.
 *
 * The pipeline writes one JSON file per district to
 * <repo>/data/processed/districts/<cds_code>.json. This module is consumed
 * exclusively by server components, so the fs reads happen at build time
 * (or, in dev, when the page is requested).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { DistrictProfile } from "./types";

const DISTRICTS_DIR = path.resolve(process.cwd(), "../../data/processed/districts");

export async function listDistrictCdsCodes(): Promise<string[]> {
  const entries = await fs.readdir(DISTRICTS_DIR);
  return entries.filter((e) => e.endsWith(".json")).map((e) => e.replace(/\.json$/, "")).sort();
}

export async function loadDistrict(cds: string): Promise<DistrictProfile | null> {
  const file = path.join(DISTRICTS_DIR, `${cds}.json`);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as DistrictProfile;
  } catch {
    return null;
  }
}

export async function loadAllDistricts(): Promise<DistrictProfile[]> {
  const codes = await listDistrictCdsCodes();
  const profiles = await Promise.all(codes.map(loadDistrict));
  return profiles.filter((p): p is DistrictProfile => p !== null);
}
