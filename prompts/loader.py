"""
Prompt Template Loader for AgroGrowth Platform
==============================================

This module provides utilities to load and manage AI prompt templates.
It supports dynamic loading, caching, and template formatting.
"""

import os
import json
from pathlib import Path
from typing import Dict, Optional, Any, List
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Prompt directory path
PROMPTS_DIR = Path(__file__).parent

class PromptLoader:
    """
    Centralized prompt template loader with caching and formatting capabilities
    """
    
    def __init__(self):
        self._cache: Dict[str, str] = {}
        self._metadata: Dict[str, Dict[str, Any]] = {}
        self._load_all_prompts()
    
    def _load_all_prompts(self):
        """Load all prompt templates and their metadata"""
        try:
            # Scan all prompt directories
            for category_dir in PROMPTS_DIR.iterdir():
                if category_dir.is_dir() and not category_dir.name.startswith('.'):
                    self._load_category_prompts(category_dir)
            
            logger.info(f"Loaded {len(self._cache)} prompt templates")
            
        except Exception as e:
            logger.error(f"Failed to load prompt templates: {str(e)}")
    
    def _load_category_prompts(self, category_dir: Path):
        """Load prompts from a specific category directory"""
        category = category_dir.name
        
        for prompt_file in category_dir.glob("*.txt"):
            prompt_name = prompt_file.stem
            prompt_key = f"{category}/{prompt_name}"
            
            try:
                with open(prompt_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Extract metadata from file header
                metadata = self._extract_metadata(content)
                template = self._extract_template(content)
                
                self._cache[prompt_key] = template
                self._metadata[prompt_key] = metadata
                
                logger.debug(f"Loaded prompt: {prompt_key}")
                
            except Exception as e:
                logger.error(f"Failed to load prompt {prompt_key}: {str(e)}")
    
    def _extract_metadata(self, content: str) -> Dict[str, Any]:
        """Extract metadata from prompt file header"""
        metadata = {}
        lines = content.split('\n')
        
        for line in lines:
            if line.startswith('# Template:'):
                metadata['template_name'] = line.replace('# Template:', '').strip()
            elif line.startswith('# Category:'):
                metadata['category'] = line.replace('# Category:', '').strip()
            elif line.startswith('# Language:'):
                metadata['language'] = line.replace('# Language:', '').strip()
            elif line.startswith('# Last Updated:'):
                metadata['last_updated'] = line.replace('# Last Updated:', '').strip()
            elif line.startswith('## Template'):
                break
        
        return metadata
    
    def _extract_template(self, content: str) -> str:
        """Extract the actual template from the file content"""
        lines = content.split('\n')
        template_start = False
        template_lines = []
        
        for line in lines:
            if line.startswith('## Template'):
                template_start = True
                continue
            elif template_start:
                template_lines.append(line)
        
        return '\n'.join(template_lines).strip()
    
    def get_prompt(self, category: str, name: str) -> Optional[str]:
        """
        Get a prompt template by category and name
        
        Args:
            category: Prompt category (diagnosis, recommendations, etc.)
            name: Prompt name within the category
            
        Returns:
            Prompt template string or None if not found
        """
        prompt_key = f"{category}/{name}"
        
        if prompt_key in self._cache:
            return self._cache[prompt_key]
        else:
            logger.warning(f"Prompt not found: {prompt_key}")
            return None
    
    def format_prompt(self, category: str, name: str, **kwargs) -> Optional[str]:
        """
        Get and format a prompt template with provided variables
        
        Args:
            category: Prompt category
            name: Prompt name
            **kwargs: Variables to substitute in the template
            
        Returns:
            Formatted prompt string or None if template not found
        """
        template = self.get_prompt(category, name)
        
        if template is None:
            return None
        
        try:
            # Replace placeholders with provided values
            formatted_prompt = template.format(**kwargs)
            return formatted_prompt
            
        except KeyError as e:
            logger.error(f"Missing required variable for prompt {category}/{name}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Failed to format prompt {category}/{name}: {str(e)}")
            return None
    
    def get_metadata(self, category: str, name: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a specific prompt"""
        prompt_key = f"{category}/{name}"
        return self._metadata.get(prompt_key)
    
    def list_prompts(self, category: Optional[str] = None) -> List[str]:
        """
        List available prompts, optionally filtered by category
        
        Args:
            category: Optional category filter
            
        Returns:
            List of available prompt keys
        """
        if category:
            return [key for key in self._cache.keys() if key.startswith(f"{category}/")]
        else:
            return list(self._cache.keys())
    
    def list_categories(self) -> List[str]:
        """Get list of available prompt categories"""
        categories = set()
        for key in self._cache.keys():
            category = key.split('/')[0]
            categories.add(category)
        return sorted(list(categories))
    
    def reload_prompt(self, category: str, name: str) -> bool:
        """
        Reload a specific prompt from file
        
        Args:
            category: Prompt category
            name: Prompt name
            
        Returns:
            True if successfully reloaded, False otherwise
        """
        prompt_file = PROMPTS_DIR / category / f"{name}.txt"
        prompt_key = f"{category}/{name}"
        
        try:
            if not prompt_file.exists():
                logger.error(f"Prompt file not found: {prompt_file}")
                return False
            
            with open(prompt_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            metadata = self._extract_metadata(content)
            template = self._extract_template(content)
            
            self._cache[prompt_key] = template
            self._metadata[prompt_key] = metadata
            
            logger.info(f"Reloaded prompt: {prompt_key}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to reload prompt {prompt_key}: {str(e)}")
            return False
    
    def validate_template(self, category: str, name: str, required_vars: List[str]) -> bool:
        """
        Validate that a template contains all required variables
        
        Args:
            category: Prompt category
            name: Prompt name
            required_vars: List of required variable names
            
        Returns:
            True if template is valid, False otherwise
        """
        template = self.get_prompt(category, name)
        
        if template is None:
            return False
        
        for var in required_vars:
            if f"{{{var}}}" not in template:
                logger.warning(f"Template {category}/{name} missing required variable: {var}")
                return False
        
        return True
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get statistics about loaded prompts"""
        stats = {
            "total_prompts": len(self._cache),
            "categories": len(self.list_categories()),
            "cache_size_kb": sum(len(template.encode('utf-8')) for template in self._cache.values()) / 1024,
            "last_loaded": datetime.now().isoformat()
        }
        
        # Count prompts per category
        category_counts = {}
        for key in self._cache.keys():
            category = key.split('/')[0]
            category_counts[category] = category_counts.get(category, 0) + 1
        
        stats["prompts_per_category"] = category_counts
        
        return stats


# JavaScript/Node.js compatible loader functions
def create_js_loader():
    """Create JavaScript-compatible prompt loading functions"""
    js_code = """
    // AgroGrowth Prompt Loader for JavaScript/Node.js
    
    const fs = require('fs');
    const path = require('path');
    
    class PromptLoader {
        constructor(promptsDir = './prompts') {
            this.promptsDir = promptsDir;
            this.cache = new Map();
            this.metadata = new Map();
            this.loadAllPrompts();
        }
        
        loadAllPrompts() {
            try {
                const categories = fs.readdirSync(this.promptsDir, { withFileTypes: true })
                    .filter(dirent => dirent.isDirectory())
                    .map(dirent => dirent.name);
                
                for (const category of categories) {
                    this.loadCategoryPrompts(category);
                }
                
                console.log(`Loaded ${this.cache.size} prompt templates`);
            } catch (error) {
                console.error('Failed to load prompt templates:', error);
            }
        }
        
        loadCategoryPrompts(category) {
            const categoryDir = path.join(this.promptsDir, category);
            
            try {
                const files = fs.readdirSync(categoryDir)
                    .filter(file => file.endsWith('.txt'));
                
                for (const file of files) {
                    const promptName = path.basename(file, '.txt');
                    const promptKey = `${category}/${promptName}`;
                    const filePath = path.join(categoryDir, file);
                    
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const metadata = this.extractMetadata(content);
                    const template = this.extractTemplate(content);
                    
                    this.cache.set(promptKey, template);
                    this.metadata.set(promptKey, metadata);
                }
            } catch (error) {
                console.error(`Failed to load category ${category}:`, error);
            }
        }
        
        extractMetadata(content) {
            const metadata = {};
            const lines = content.split('\\n');
            
            for (const line of lines) {
                if (line.startsWith('# Template:')) {
                    metadata.templateName = line.replace('# Template:', '').trim();
                } else if (line.startsWith('# Category:')) {
                    metadata.category = line.replace('# Category:', '').trim();
                } else if (line.startsWith('# Language:')) {
                    metadata.language = line.replace('# Language:', '').trim();
                } else if (line.startsWith('# Last Updated:')) {
                    metadata.lastUpdated = line.replace('# Last Updated:', '').trim();
                } else if (line.startsWith('## Template')) {
                    break;
                }
            }
            
            return metadata;
        }
        
        extractTemplate(content) {
            const lines = content.split('\\n');
            let templateStart = false;
            const templateLines = [];
            
            for (const line of lines) {
                if (line.startsWith('## Template')) {
                    templateStart = true;
                    continue;
                } else if (templateStart) {
                    templateLines.push(line);
                }
            }
            
            return templateLines.join('\\n').trim();
        }
        
        getPrompt(category, name) {
            const promptKey = `${category}/${name}`;
            return this.cache.get(promptKey) || null;
        }
        
        formatPrompt(category, name, variables = {}) {
            const template = this.getPrompt(category, name);
            
            if (!template) {
                return null;
            }
            
            try {
                let formatted = template;
                for (const [key, value] of Object.entries(variables)) {
                    formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
                }
                return formatted;
            } catch (error) {
                console.error(`Failed to format prompt ${category}/${name}:`, error);
                return null;
            }
        }
        
        listPrompts(category = null) {
            const keys = Array.from(this.cache.keys());
            
            if (category) {
                return keys.filter(key => key.startsWith(`${category}/`));
            }
            
            return keys;
        }
        
        listCategories() {
            const categories = new Set();
            for (const key of this.cache.keys()) {
                const category = key.split('/')[0];
                categories.add(category);
            }
            return Array.from(categories).sort();
        }
    }
    
    // Export for CommonJS and ES modules
    module.exports = PromptLoader;
    
    // Example usage:
    // const loader = new PromptLoader('./prompts');
    // const prompt = loader.formatPrompt('diagnosis', 'plant_disease_detection', {
    //     crop_type: 'tomato',
    //     symptoms_description: 'Yellow spots on leaves',
    //     weather_conditions: 'humid'
    // });
    """
    
    return js_code


# Global loader instance
_global_loader = PromptLoader()

def get_prompt(category: str, name: str) -> Optional[str]:
    """Get a prompt template (convenience function)"""
    return _global_loader.get_prompt(category, name)

def format_prompt(category: str, name: str, **kwargs) -> Optional[str]:
    """Format a prompt template with variables (convenience function)"""
    return _global_loader.format_prompt(category, name, **kwargs)

def list_prompts(category: Optional[str] = None) -> List[str]:
    """List available prompts (convenience function)"""
    return _global_loader.list_prompts(category)

def get_loader() -> PromptLoader:
    """Get the global prompt loader instance"""
    return _global_loader
