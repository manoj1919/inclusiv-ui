/**
 * Inline glossary tooltip. Wrap an acronym or term in <Term>; renders an
 * <abbr> with a dotted underline + hover/focus definition. Definitions live
 * in one place so the glossary page and inline tooltips never drift.
 */

export const DEFINITIONS: Record<string, string> = {
  IEP: "Individualized Education Program — a legally binding plan describing the special education services, accommodations, and goals for a student with a disability.",
  LRE: "Least Restrictive Environment — the federal IDEA requirement that students with disabilities be educated alongside non-disabled peers to the maximum extent appropriate.",
  SWD: "Students With Disabilities — a broad subgroup that includes autism but also speech/language, learning, emotional, intellectual, and other disability categories.",
  DFS: "Distance From Standard — the California School Dashboard measure of how far above (positive) or below (negative) grade-level standard students performed on the state test, in points.",
  ELA: "English Language Arts — the state-administered reading and writing assessment.",
  ASD: "Autism Spectrum Disorder — the federal special-education eligibility category for autistic students.",
  SDC: "Special Day Class — a self-contained special-education classroom; students spend most of the day with other students with disabilities.",
  RSP: "Resource Specialist Program — students spend most of the day in a regular classroom but go to a smaller resource room for targeted instruction in specific subjects.",
  BCBA: "Board Certified Behavior Analyst — a credentialed professional who designs and oversees behavior intervention plans.",
  AAC: "Augmentative and Alternative Communication — devices, apps, or symbol systems that support communication for students with limited speech.",
  SELPA: "Special Education Local Plan Area — the regional administrative unit that organizes special education across one or more districts in California.",
  OAH: "Office of Administrative Hearings — the California agency that adjudicates due-process disputes between families and school districts.",
  OCR: "Office for Civil Rights (US Department of Education) — investigates discrimination complaints in public schools, including disability-based complaints.",
  CDE: "California Department of Education — the state agency that publishes the source data used here.",
  CDS: "County–District–School code — California's identifier for a district or school (e.g., 37-68338 is San Diego Unified).",
  IDEA: "Individuals with Disabilities Education Act — the federal law that guarantees a free appropriate public education to children with disabilities.",
};

export function Term({ children }: { children: string }) {
  const def = DEFINITIONS[children];
  if (!def) {
    return <span>{children}</span>;
  }
  return (
    <abbr className="gloss" title={def}>
      {children}
    </abbr>
  );
}
