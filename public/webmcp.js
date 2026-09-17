// WebMCP tool registration for the UK Prep Schools directory.
// Implements the W3C WebMCP incubation draft's client-side tool-registration
// pattern (navigator.modelContext) so an in-browser agent can search and read
// listings without scraping the DOM. Feature-flagged: only loaded when
// PUBLIC_WEBMCP_ENABLED is true (see astro Base layout), and itself a no-op
// in any browser that doesn't implement the API yet.
(async function registerWebMcpTools() {
  if (!("modelContext" in navigator)) return;

  let schools = null;
  async function loadSchools() {
    if (schools) return schools;
    const res = await fetch("/api/schools.json");
    schools = await res.json();
    return schools;
  }

  const context = /** @type {any} */ (navigator).modelContext;

  context.registerTool({
    name: "directory.search",
    description:
      "Search UK preparatory schools by free-text query, county, gender, or day/boarding type.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text search across school name, town and county" },
        county: { type: "string", description: "Exact county name, e.g. Surrey" },
        gender: { type: "string", enum: ["co-ed", "boys", "girls"] },
        boarding: { type: "string", enum: ["day", "boarding", "day-and-boarding"] },
      },
    },
    async execute({ query, county, gender, boarding }) {
      const all = await loadSchools();
      const q = (query || "").toLowerCase();
      const results = all.filter((school) => {
        const matchesQuery =
          !q ||
          school.name.toLowerCase().includes(q) ||
          school.town.toLowerCase().includes(q) ||
          school.county.toLowerCase().includes(q);
        const matchesCounty = !county || school.county.toLowerCase() === county.toLowerCase();
        const matchesGender = !gender || school.gender === gender;
        const matchesBoarding = !boarding || school.boarding === boarding;
        return matchesQuery && matchesCounty && matchesGender && matchesBoarding;
      });
      return { content: [{ type: "text", text: JSON.stringify(results) }] };
    },
  });

  context.registerTool({
    name: "directory.schools",
    description: "List every prep school in the directory with its structured record.",
    inputSchema: { type: "object", properties: {} },
    async execute() {
      const all = await loadSchools();
      return { content: [{ type: "text", text: JSON.stringify(all) }] };
    },
  });
})();
