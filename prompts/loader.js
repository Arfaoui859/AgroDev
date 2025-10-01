// AgroGrowth Prompt Loader for JavaScript/Node.js

const fs = require("fs");
const path = require("path");

class PromptLoader {
  constructor(promptsDir = "./prompts") {
    this.promptsDir = promptsDir;
    this.cache = new Map();
    this.metadata = new Map();
    this.loadAllPrompts();
  }

  loadAllPrompts() {
    try {
      const categories = fs
        .readdirSync(this.promptsDir, { withFileTypes: true })
        .filter(
          (dirent) => dirent.isDirectory() && !dirent.name.startsWith("."),
        )
        .map((dirent) => dirent.name);

      for (const category of categories) {
        this.loadCategoryPrompts(category);
      }

      console.log(`📝 Loaded ${this.cache.size} prompt templates`);
    } catch (error) {
      console.error("❌ Failed to load prompt templates:", error);
    }
  }

  loadCategoryPrompts(category) {
    const categoryDir = path.join(this.promptsDir, category);

    try {
      const files = fs
        .readdirSync(categoryDir)
        .filter((file) => file.endsWith(".txt"));

      for (const file of files) {
        const promptName = path.basename(file, ".txt");
        const promptKey = `${category}/${promptName}`;
        const filePath = path.join(categoryDir, file);

        const content = fs.readFileSync(filePath, "utf-8");
        const metadata = this.extractMetadata(content);
        const template = this.extractTemplate(content);

        this.cache.set(promptKey, template);
        this.metadata.set(promptKey, metadata);

        console.log(`✅ Loaded prompt: ${promptKey}`);
      }
    } catch (error) {
      console.error(`❌ Failed to load category ${category}:`, error);
    }
  }

  extractMetadata(content) {
    const metadata = {};
    const lines = content.split("\n");

    for (const line of lines) {
      if (line.startsWith("# Template:")) {
        metadata.templateName = line.replace("# Template:", "").trim();
      } else if (line.startsWith("# Category:")) {
        metadata.category = line.replace("# Category:", "").trim();
      } else if (line.startsWith("# Language:")) {
        metadata.language = line.replace("# Language:", "").trim();
      } else if (line.startsWith("# Last Updated:")) {
        metadata.lastUpdated = line.replace("# Last Updated:", "").trim();
      } else if (line.startsWith("## Template")) {
        break;
      }
    }

    return metadata;
  }

  extractTemplate(content) {
    const lines = content.split("\n");
    let templateStart = false;
    const templateLines = [];

    for (const line of lines) {
      if (line.startsWith("## Template")) {
        templateStart = true;
        continue;
      } else if (templateStart) {
        templateLines.push(line);
      }
    }

    return templateLines.join("\n").trim();
  }

  getPrompt(category, name) {
    const promptKey = `${category}/${name}`;
    const prompt = this.cache.get(promptKey);

    if (!prompt) {
      console.warn(`⚠️ Prompt not found: ${promptKey}`);
      return null;
    }

    return prompt;
  }

  formatPrompt(category, name, variables = {}) {
    const template = this.getPrompt(category, name);

    if (!template) {
      return null;
    }

    try {
      let formatted = template;

      // Replace all template variables with provided values
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{${key}\\}`, "g");
        formatted = formatted.replace(regex, value || "");
      }

      return formatted;
    } catch (error) {
      console.error(`❌ Failed to format prompt ${category}/${name}:`, error);
      return null;
    }
  }

  getMetadata(category, name) {
    const promptKey = `${category}/${name}`;
    return this.metadata.get(promptKey) || null;
  }

  listPrompts(category = null) {
    const keys = Array.from(this.cache.keys());

    if (category) {
      return keys.filter((key) => key.startsWith(`${category}/`));
    }

    return keys;
  }

  listCategories() {
    const categories = new Set();
    for (const key of this.cache.keys()) {
      const category = key.split("/")[0];
      categories.add(category);
    }
    return Array.from(categories).sort();
  }

  validateTemplate(category, name, requiredVars = []) {
    const template = this.getPrompt(category, name);

    if (!template) {
      return false;
    }

    for (const variable of requiredVars) {
      if (!template.includes(`{${variable}}`)) {
        console.warn(
          `⚠️ Template ${category}/${name} missing required variable: ${variable}`,
        );
        return false;
      }
    }

    return true;
  }

  reloadPrompt(category, name) {
    const promptFile = path.join(this.promptsDir, category, `${name}.txt`);
    const promptKey = `${category}/${name}`;

    try {
      if (!fs.existsSync(promptFile)) {
        console.error(`❌ Prompt file not found: ${promptFile}`);
        return false;
      }

      const content = fs.readFileSync(promptFile, "utf-8");
      const metadata = this.extractMetadata(content);
      const template = this.extractTemplate(content);

      this.cache.set(promptKey, template);
      this.metadata.set(promptKey, metadata);

      console.log(`🔄 Reloaded prompt: ${promptKey}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to reload prompt ${promptKey}:`, error);
      return false;
    }
  }

  getCacheStats() {
    const stats = {
      totalPrompts: this.cache.size,
      categories: this.listCategories().length,
      cacheSizeKB:
        Array.from(this.cache.values()).reduce(
          (total, template) => total + Buffer.byteLength(template, "utf8"),
          0,
        ) / 1024,
      lastLoaded: new Date().toISOString(),
    };

    // Count prompts per category
    const categoryCount = {};
    for (const key of this.cache.keys()) {
      const category = key.split("/")[0];
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }

    stats.promptsPerCategory = categoryCount;

    return stats;
  }
}

// Browser-compatible version (for client-side usage)
class BrowserPromptLoader {
  constructor() {
    this.cache = new Map();
    this.metadata = new Map();
  }

  async loadPrompt(category, name) {
    const promptKey = `${category}/${name}`;

    if (this.cache.has(promptKey)) {
      return this.cache.get(promptKey);
    }

    try {
      const response = await fetch(`/prompts/${category}/${name}.txt`);

      if (!response.ok) {
        console.warn(`⚠️ Prompt not found: ${promptKey}`);
        return null;
      }

      const content = await response.text();
      const metadata = this.extractMetadata(content);
      const template = this.extractTemplate(content);

      this.cache.set(promptKey, template);
      this.metadata.set(promptKey, metadata);

      return template;
    } catch (error) {
      console.error(`❌ Failed to load prompt ${promptKey}:`, error);
      return null;
    }
  }

  extractMetadata(content) {
    // Same implementation as Node.js version
    const metadata = {};
    const lines = content.split("\n");

    for (const line of lines) {
      if (line.startsWith("# Template:")) {
        metadata.templateName = line.replace("# Template:", "").trim();
      } else if (line.startsWith("# Category:")) {
        metadata.category = line.replace("# Category:", "").trim();
      } else if (line.startsWith("# Language:")) {
        metadata.language = line.replace("# Language:", "").trim();
      } else if (line.startsWith("# Last Updated:")) {
        metadata.lastUpdated = line.replace("# Last Updated:", "").trim();
      } else if (line.startsWith("## Template")) {
        break;
      }
    }

    return metadata;
  }

  extractTemplate(content) {
    // Same implementation as Node.js version
    const lines = content.split("\n");
    let templateStart = false;
    const templateLines = [];

    for (const line of lines) {
      if (line.startsWith("## Template")) {
        templateStart = true;
        continue;
      } else if (templateStart) {
        templateLines.push(line);
      }
    }

    return templateLines.join("\n").trim();
  }

  async formatPrompt(category, name, variables = {}) {
    const template = await this.loadPrompt(category, name);

    if (!template) {
      return null;
    }

    try {
      let formatted = template;

      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{${key}\\}`, "g");
        formatted = formatted.replace(regex, value || "");
      }

      return formatted;
    } catch (error) {
      console.error(`❌ Failed to format prompt ${category}/${name}:`, error);
      return null;
    }
  }
}

// Export for different environments
if (typeof module !== "undefined" && module.exports) {
  // Node.js environment
  module.exports = PromptLoader;
} else if (typeof window !== "undefined") {
  // Browser environment
  window.PromptLoader = BrowserPromptLoader;
}

// Example usage:
/*
// Node.js
const PromptLoader = require('./prompts/loader.js');
const loader = new PromptLoader('./prompts');

const prompt = loader.formatPrompt('diagnosis', 'plant_disease_detection', {
    crop_type: 'tomato',
    symptoms_description: 'Yellow spots on leaves',
    weather_conditions: 'humid',
    location: 'Nabeul, Tunisia'
});

console.log(prompt);

// Browser
const loader = new PromptLoader();
loader.formatPrompt('communication', 'farmer_chat', {
    farmer_question: 'How to treat tomato blight?',
    farmer_location: 'Tunis',
    urgency_level: 'high'
}).then(prompt => {
    console.log(prompt);
});
*/
