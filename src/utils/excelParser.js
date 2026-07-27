import * as XLSX from 'xlsx';

// Reads "Databricks Ideas.xlsx".
//
// Sheet layout (both idea sheets share the same columns):
//   Industry | Problem (Databricks Backend) | App Idea (The Last Mile) |
//   Example Companies | Public Dataset | Dataset URL | Fit | Status
//
// "Build Plan" is the human-facing sprint queue, not an idea bank, so it is
// skipped here. Example Companies is illustrative context only: it must never
// drive the framing of a post (name the industry, not the company).
// Neither of these is an idea bank. "Build Plan" is the local master's sprint
// queue plus a private plan header (never published). "Build Queue" is the
// sanitized, published version of just the sprints, read by parseBuildQueue.
const SKIP_SHEETS = ['build plan', 'build queue'];

const pick = (row, names) => {
  for (const n of names) {
    if (row[n] !== undefined && String(row[n]).trim() !== '') return String(row[n]).trim();
  }
  return '';
};

// Reads the sequenced sprint queue. Returns [] when the sheet is absent, so an
// older workbook simply shows no plan rather than breaking the page.
export const parseBuildQueue = async (fileBuffer) => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const name = workbook.SheetNames.find((n) => n.toLowerCase().trim() === 'build queue');
    if (!name) return [];
    return XLSX.utils.sheet_to_json(workbook.Sheets[name])
      .map((row) => ({
        sprint: Number(pick(row, ['Sprint'])) || 0,
        industry: pick(row, ['Industry']),
        question: pick(row, ['Question', 'Problem']),
        dataset: pick(row, ['Dataset']),
        datasetUrl: pick(row, ['Dataset URL', 'URL']),
        backend: pick(row, ['Backend']),
        frontend: pick(row, ['Frontend']),
        postAngle: pick(row, ['Post Angle']),
      }))
      .filter((r) => r.sprint && r.question)
      .sort((a, b) => a.sprint - b.sprint);
  } catch (error) {
    console.error('Failed to parse build queue', error);
    return [];
  }
};

export const parseExcelIdeas = async (fileBuffer) => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const ideas = [];

    workbook.SheetNames.forEach((sheetName) => {
      if (SKIP_SHEETS.includes(sheetName.toLowerCase().trim())) return;
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      rows.forEach((row) => {
        // A row is usable when it states a problem. Older workbooks that only
        // had a company name still parse, so a stale file does not break.
        const problem = pick(row, [
          'Problem (Databricks Backend)',
          'Data Engineering & Databricks Ideas',
          'Problem',
          'Data',
          'Context',
        ]);
        const company = pick(row, ['Example Companies', 'Company Name', 'Company', 'Brand', 'Name']);
        if (!problem && !company) return;

        ideas.push({
          sheet: sheetName,
          industry: pick(row, ['Industry']) || sheetName,
          problem,
          appIdea: pick(row, ['App Idea (The Last Mile)', 'Custom App Ideas', 'App Idea']),
          exampleCompanies: company,
          dataset: pick(row, ['Public Dataset', 'Dataset']),
          datasetUrl: pick(row, ['Dataset URL', 'URL']),
          fit: pick(row, ['Fit']) || 'Medium',
          status: pick(row, ['Status']) || 'Not started',
          // Back-compat for older callers.
          data_context: problem,
        });
      });
    });

    // Best-fit rows first so the radar leans on the strongest ideas.
    const rank = { high: 0, medium: 1, low: 2 };
    ideas.sort((a, b) => (rank[a.fit.toLowerCase()] ?? 1) - (rank[b.fit.toLowerCase()] ?? 1));
    return ideas;
  } catch (error) {
    console.error('Failed to parse excel file', error);
    return [];
  }
};
