/**
 * TypeScript types for the district profile schema (v0.2.0).
 *
 * Mirrors data/schema/district.schema.json. Organized under the Donabedian
 * Structure–Process–Outcome quality model per docs/framework.md. Schema is
 * authoritative; this is a convenience for IDE/typecheck only. Fields are
 * optional because the pipeline only populates what each source provides.
 */

export type Sourced<T> = {
  value: T | null;
  source: string;
  as_of: string;
  fetched_at?: string;
  url?: string;
  note?: string;
};

export type AIGenerated = {
  value: string;
  ai_generated: true;
  ai_model: string;
  ai_generated_at: string;
  ai_disclaimer: string;
  based_on_sources?: string[];
};

export type StructureBlock = {
  /**
   * Certificated-staff counts and density ratios from CDE Staff
   * Race/Ethnicity (StRE). PSV (pupil services) bundles counselors,
   * psychologists, SLPs, social workers, and nurses — granular SPED-role
   * counts are not published as a district-level downloadable file post
   * 2018-19.
   */
  staffing?: {
    teachers?: Sourced<number>;
    pupil_services?: Sourced<number>;
    administrators?: Sourced<number>;
    other_certificated?: Sourced<number>;
    all_certificated?: Sourced<number>;
    teachers_per_100_iep?: Sourced<number>;
    pupil_services_per_1k_students?: Sourced<number>;
    pupil_services_per_100_iep?: Sourced<number>;
  };
  programs?: {
    autism_specific_classrooms?: { name: string; grade_range?: string; site?: string }[];
    bcba_on_staff?: Sourced<boolean>;
    aac_support_level?: Sourced<string>;
    transition_18_22_program?: Sourced<boolean>;
    reverse_inclusion?: Sourced<boolean>;
  };
  related_services?: {
    slp_caseload_ratio?: Sourced<number>;
    ot_available?: Sourced<boolean>;
    pt_available?: Sourced<boolean>;
    social_skills_groups?: Sourced<boolean>;
  };
  reviews?: {
    state_audit_findings_5yr?: Sourced<number>;
  };
  district_web_research?: {
    researched_at: string;
    district_website?: string;
    additional_findings: string;
    sources: string[];
  };
};

export type ProcessBlock = {
  /** Least Restrictive Environment placement — SPP Indicator 5. */
  lre?: {
    lre_80pct_plus_gen_ed_all_disabilities?: Sourced<number>;
    lre_80pct_plus_gen_ed_autism?: Sourced<number>;
    lre_separate_setting_all_disabilities?: Sourced<number>;
    lre_separate_setting_autism?: Sourced<number>;
  };
  /** OAH due-process + OCR civil-rights volume — process measure of dispute escalation. */
  disputes?: {
    oah_cases_5yr_total?: Sourced<number>;
    oah_cases_5yr_autism?: Sourced<number>;
    ocr_open_investigations?: Sourced<number>;
    ocr_open_investigations_disability?: Sourced<number>;
  };
};

export type OutcomeBlock = {
  academics?: {
    ela_distance_from_standard_swd?: Sourced<number>;
    ela_distance_from_standard_all?: Sourced<number>;
    math_distance_from_standard_swd?: Sourced<number>;
    math_distance_from_standard_all?: Sourced<number>;
  };
  behavior?: {
    chronic_absenteeism_rate_swd?: Sourced<number>;
    chronic_absenteeism_rate_all?: Sourced<number>;
    suspension_rate_swd?: Sourced<number>;
    suspension_rate_all?: Sourced<number>;
  };
};

export type DistrictProfile = {
  schema_version: string;
  cds_code: string;
  name: string;
  county: string;
  county_code: string;
  district_type: string;
  region?: string;
  website?: string;
  last_updated: string;
  data_sources_used?: string[];
  enrollment?: {
    total?: Sourced<number>;
    students_with_iep?: Sourced<number>;
    students_with_autism?: Sourced<number>;
    pct_iep?: Sourced<number>;
    pct_autism?: Sourced<number>;
  };
  structure?: StructureBlock;
  process?: ProcessBlock;
  outcome?: OutcomeBlock;
  ai_summaries?: {
    overview?: AIGenerated;
    compliance_explained?: AIGenerated;
    programs_explained?: AIGenerated;
    what_this_means_for_parents?: AIGenerated;
  };
  build_provenance?: {
    pipeline_version: string;
    built_at: string;
    raw_snapshots?: { source: string; path: string; sha256: string }[];
  };
};

/**
 * A single school within a pilot district. School-level data is
 * all-students-with-disabilities only — CDE publishes no autism split below
 * district level — so there are no autism, compliance, or AI-summary fields.
 * Schools retain the legacy flat shape; the S/P/O restructure applies to
 * district profiles only.
 */
export type SchoolProfile = {
  schema_version: string;
  level: "school";
  cds_code: string;
  school_code: string;
  name: string;
  district_cds: string;
  district_name: string;
  county: string;
  charter: boolean;
  enrollment?: {
    total?: Sourced<number>;
    students_with_iep?: Sourced<number>;
    pct_iep?: Sourced<number>;
  };
  inclusion_metrics?: {
    lre_80pct_plus_gen_ed_all_disabilities?: Sourced<number>;
    lre_separate_setting_all_disabilities?: Sourced<number>;
  };
  outcome_metrics?: {
    ela_distance_from_standard_all?: Sourced<number>;
    ela_distance_from_standard_swd?: Sourced<number>;
    math_distance_from_standard_all?: Sourced<number>;
    math_distance_from_standard_swd?: Sourced<number>;
    chronic_absenteeism_rate_all?: Sourced<number>;
    chronic_absenteeism_rate_swd?: Sourced<number>;
    suspension_rate_all?: Sourced<number>;
    suspension_rate_swd?: Sourced<number>;
  };
  data_sources_used?: string[];
  build_provenance?: { built_at: string };
  last_updated: string;
};
