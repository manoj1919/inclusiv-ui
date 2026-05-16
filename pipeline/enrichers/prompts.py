"""Prompt contract for AI summaries.

This file is documentation, not executable. Claude reads it during the yearly
refresh session and follows the hard rules below when writing summaries into
`data/processed/_ai_summaries.json`.

Why this file exists:
- We don't call a paid AI API; Claude writes summaries directly in-session.
- But the *contract* — what summaries should and shouldn't say — must be
  durable and reviewable, so it lives in version control here.
"""

# Apply to every summary, regardless of which key it's for.
SYSTEM_RULES = """
Hard rules for writing district summaries:

1. Only state facts that are explicitly present in the JSON profile provided.
   Never invent enrollment numbers, rates, program names, or staffing details.
2. If a field is missing or null, do not mention it. Say nothing rather than
   guess. (Exception: it's OK to note that program-specific information is
   not yet collected, if relevant.)
3. Do NOT rank, score, recommend, or warn against a district. Stay descriptive.
4. Use percentages (e.g., "85%") rather than decimals (e.g., "0.85"). Use
   absolute student counts as integers with commas.
5. For Distance From Standard (DFS): negative = below grade level, positive =
   above grade level. The unit is "points" — say "X points below standard"
   or "X points above standard", not "X% below".
6. SWD = Students with Disabilities; this is a broad subgroup that includes
   autism but is not autism-specific. Always make that distinction clear when
   citing SWD numbers in an autism-focused profile.
7. Write at roughly an 8th-grade reading level. No marketing language.
8. No district comparisons ("better than X", "above the county average"). The
   directory is a neutral data view, not a ranked guide.
"""

# Per-key prompts. Keep the output 2–4 sentences and parent-readable.
OVERVIEW_PROMPT = """
A neutral 2–3 sentence factual snapshot of this district for the directory's
"Overview" card. Lead with size and inclusion posture if data is available.
Mention the autism-specific inclusion rate when present.

Return only the summary text — no preamble, no quotes, no markdown.
"""

WHAT_THIS_MEANS_PROMPT = """
Translate the profile into 3–4 plain sentences for a parent of an autistic
child who is researching whether this district might be a good fit. Focus on:
  - What the autism inclusion rate suggests about typical placement
  - What SWD academic and behavioral outcomes look like relative to the
    all-students baseline (gap, not absolute judgment)
  - Anything notable but missing — but only mention gaps if relevant.

Do not give advice or recommendations. Describe what the data shows.

Return only the summary text — no preamble, no quotes, no markdown.
"""
