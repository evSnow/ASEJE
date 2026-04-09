class ActivityLogExportManager {
  constructor(options = {}) {
    this.entries = [];
    this.maxEntries = typeof options.maxEntries === "number" && options.maxEntries > 0
      ? options.maxEntries
      : 500;

    this.defaultFileName = options.defaultFileName || "aseje-activity-log.txt";

    this.allowedCategories = [
      "GENERAL",
      "SIDEBAR",
      "SEARCH",
      "AUDIO",
      "HELP",
      "FAQ",
      "DEBUG",
      "SETTINGS"
    ];
  }

  setMaxEntries(limit) {
    if (typeof limit !== "number" || limit <= 0) {
      return false;
    }

    this.maxEntries = limit;

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(this.entries.length - this.maxEntries);
    }

    return true;
  }

  getMaxEntries() {
    return this.maxEntries;
  }

  setDefaultFileName(fileName) {
    if (typeof fileName !== "string" || fileName.trim() === "") {
      return false;
    }

    this.defaultFileName = fileName.trim();
    return true;
  }

  getDefaultFileName() {
    return this.defaultFileName;
  }

  getAllowedCategories() {
    return [...this.allowedCategories];
  }

  isValidCategory(category) {
    if (typeof category !== "string") {
      return false;
    }

    return this.allowedCategories.includes(category.toUpperCase());
  }

  normalizeCategory(category) {
    if (typeof category !== "string" || category.trim() === "") {
      return "GENERAL";
    }

    const normalized = category.trim().toUpperCase();
    return this.isValidCategory(normalized) ? normalized : "GENERAL";
  }

  sanitizeText(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value).replace(/\s+/g, " ").trim();
  }

  createTimestamp() {
    return new Date().toLocaleString();
  }

  generateEntryId() {
    const timePart = Date.now().toString(36);
    const randomPart = Math.random().toString(36).slice(2, 8);
    return `aseje-log-${timePart}-${randomPart}`;
  }

  createEntry(message, category = "GENERAL", details = "") {
    const cleanMessage = this.sanitizeText(message);
    const cleanDetails = this.sanitizeText(details);

    if (!cleanMessage) {
      return null;
    }

    return {
      id: this.generateEntryId(),
      timestamp: this.createTimestamp(),
      category: this.normalizeCategory(category),
      message: cleanMessage,
      details: cleanDetails
    };
  }

  addEntry(message, category = "GENERAL", details = "") {
    const entry = this.createEntry(message, category, details);

    if (!entry) {
      return null;
    }

    this.entries.push(entry);

    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    return entry;
  }

  addEntries(entryList) {
    if (!Array.isArray(entryList)) {
      return [];
    }

    const results = [];

    for (const item of entryList) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const addedEntry = this.addEntry(
        item.message || "",
        item.category || "GENERAL",
        item.details || ""
      );

      if (addedEntry) {
        results.push(addedEntry);
      }
    }

    return results;
  }

  getEntries() {
    return [...this.entries];
  }

  getEntryCount() {
    return this.entries.length;
  }

  clearEntries() {
    this.entries = [];
    return true;
  }

  removeEntryById(entryId) {
    const oldLength = this.entries.length;
    this.entries = this.entries.filter((entry) => entry.id !== entryId);
    return this.entries.length !== oldLength;
  }

  findEntriesByCategory(category) {
    const normalizedCategory = this.normalizeCategory(category);
    return this.entries.filter((entry) => entry.category === normalizedCategory);
  }

  searchEntries(keyword) {
    if (typeof keyword !== "string" || keyword.trim() === "") {
      return this.getEntries();
    }

    const query = keyword.trim().toLowerCase();

    return this.entries.filter((entry) => {
      return (
        entry.message.toLowerCase().includes(query) ||
        entry.details.toLowerCase().includes(query) ||
        entry.category.toLowerCase().includes(query) ||
        entry.timestamp.toLowerCase().includes(query)
      );
    });
  }

  getRecentEntries(limit = 10) {
    if (typeof limit !== "number" || limit <= 0) {
      return [];
    }

    return this.entries.slice(-limit);
  }

  sortEntriesByNewest() {
    return [...this.entries].reverse();
  }

  formatEntry(entry, index = null) {
    if (!entry) {
      return "";
    }

    const prefix = index !== null ? `${index + 1}. ` : "";
    let line = `${prefix}[${entry.timestamp}] [${entry.category}] ${entry.message}`;

    if (entry.details) {
      line += ` | Details: ${entry.details}`;
    }

    return line;
  }

  formatEntries(entries = null) {
    const targetEntries = Array.isArray(entries) ? entries : this.entries;

    if (!Array.isArray(targetEntries) || targetEntries.length === 0) {
      return "No activity log entries available.";
    }

    return targetEntries
      .map((entry, index) => this.formatEntry(entry, index))
      .join("\n");
  }

  buildExportHeader() {
    return [
      "ASEJE Activity Log Export",
      "========================",
      `Generated: ${this.createTimestamp()}`,
      `Total Entries: ${this.getEntryCount()}`,
      ""
    ].join("\n");
  }

  buildCategorySummary() {
    const counts = {};

    for (const category of this.allowedCategories) {
      counts[category] = 0;
    }

    for (const entry of this.entries) {
      if (!counts[entry.category]) {
        counts[entry.category] = 0;
      }

      counts[entry.category] += 1;
    }

    const lines = [
      "Category Summary",
      "----------------"
    ];

    for (const category of Object.keys(counts)) {
      lines.push(`${category}: ${counts[category]}`);
    }

    lines.push("");
    return lines.join("\n");
  }

  buildDetailedExport(entries = null) {
    const targetEntries = Array.isArray(entries) ? entries : this.entries;

    return [
      this.buildExportHeader(),
      this.buildCategorySummary(),
      "Detailed Entries",
      "--------------",
      this.formatEntries(targetEntries)
    ].join("\n");
  }

  buildSimpleExport(entries = null) {
    const targetEntries = Array.isArray(entries) ? entries : this.entries;
    return this.formatEntries(targetEntries);
  }

  toJSON() {
    return JSON.stringify(
      {
        exportedAt: this.createTimestamp(),
        totalEntries: this.getEntryCount(),
        entries: this.entries
      },
      null,
      2
    );
  }

  loadFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);

      if (!parsed || !Array.isArray(parsed.entries)) {
        return false;
      }

      this.entries = parsed.entries
        .map((item) => {
          const created = this.createEntry(
            item.message || "",
            item.category || "GENERAL",
            item.details || ""
          );

          if (!created) {
            return null;
          }

          created.id = item.id || this.generateEntryId();
          created.timestamp = item.timestamp || this.createTimestamp();
          return created;
        })
        .filter(Boolean);

      return true;
    } catch (error) {
      return false;
    }
  }

  getStatistics() {
    const stats = {
      totalEntries: this.getEntryCount(),
      categories: {},
      oldestEntry: null,
      newestEntry: null
    };

    for (const category of this.allowedCategories) {
      stats.categories[category] = 0;
    }

    for (const entry of this.entries) {
      if (!stats.categories[entry.category]) {
        stats.categories[entry.category] = 0;
      }

      stats.categories[entry.category] += 1;
    }

    if (this.entries.length > 0) {
      stats.oldestEntry = this.entries[0];
      stats.newestEntry = this.entries[this.entries.length - 1];
    }

    return stats;
  }

  printStatisticsToConsole() {
    const stats = this.getStatistics();

    console.log("ASEJE Activity Log Statistics");
    console.log("============================");
    console.log("Total Entries:", stats.totalEntries);
    console.log("Category Breakdown:", stats.categories);

    if (stats.oldestEntry) {
      console.log("Oldest Entry:", this.formatEntry(stats.oldestEntry));
    }

    if (stats.newestEntry) {
      console.log("Newest Entry:", this.formatEntry(stats.newestEntry));
    }
  }

  loadSampleEntries() {
    const sampleEntries = [
      {
        message: "Sidebar opened by user",
        category: "SIDEBAR",
        details: "Main sidebar panel loaded successfully"
      },
      {
        message: "Search used in sidebar",
        category: "SEARCH",
        details: "User searched for beginner help content"
      },
      {
        message: "Audio notification file selected",
        category: "AUDIO",
        details: "Selected custom breakpoint notification sound"
      },
      {
        message: "FAQ panel opened",
        category: "FAQ",
        details: "User viewed common troubleshooting questions"
      },
      {
        message: "Debugger started",
        category: "DEBUG",
        details: "User launched a Python debugging session"
      },
      {
        message: "Settings viewed",
        category: "SETTINGS",
        details: "Font size and sidebar settings displayed"
      },
      {
        message: "Help panel accessed",
        category: "HELP",
        details: "User opened beginner guidance tools"
      }
    ];

    return this.addEntries(sampleEntries);
  }
}

function createDefaultActivityLogManager() {
  const manager = new ActivityLogExportManager();
  manager.loadSampleEntries();
  return manager;
}

function runSampleActivityLogExport() {
  const manager = createDefaultActivityLogManager();
  manager.printStatisticsToConsole();
  return manager.buildDetailedExport();
}

module.exports = {
  ActivityLogExportManager,
  createDefaultActivityLogManager,
  runSampleActivityLogExport
};
