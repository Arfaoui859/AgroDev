#!/usr/bin/env node

/**
 * Database Verification and Setup Helper
 * Usage: node scripts/verify-and-fix-db.js
 * 
 * This script helps you:
 * 1. Verify if database tables exist
 * 2. Identify what's missing
 * 3. Provide clear fix instructions
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl =
  process.env.SUPABASE_URL || "https://jymrhhlwdbclctobhbsi.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(`
❌ CONFIGURATION ERROR
═══════════════════════════════════════════════════════════
Missing environment variables:
- SUPABASE_URL: ${supabaseUrl ? "✅ Set" : "❌ Not set"}
- SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? "✅ Set" : "❌ Not set"}

Make sure your .env.local file contains these variables.
═══════════════════════════════════════════════════════════
  `);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .limit(0);

    return { exists: !error, error };
  } catch (err) {
    return { exists: false, error: err };
  }
}

async function main() {
  console.log(`
╔═════════════════════════════════════════════════════════════╗
║        Database Verification & Setup Helper                ║
║                                                             ║
║ This script verifies your Supabase database configuration  ║
╚═════════════════════════════════════════════════════════════╝
  `);

  console.log("🔍 Checking Supabase connection...");

  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    console.log("✅ Supabase connection successful\n");
  } catch (err) {
    console.error(`❌ Supabase connection failed: ${err.message}\n`);
    process.exit(1);
  }

  // Check for required tables
  const requiredTables = ["users", "user_profiles"];
  const tableStatus = {};

  console.log("🔍 Checking required tables...\n");

  for (const table of requiredTables) {
    const result = await checkTable(table);
    tableStatus[table] = result.exists;

    if (result.exists) {
      console.log(`✅ Table "${table}" exists`);
    } else {
      console.log(`❌ Table "${table}" is missing`);
      if (result.error?.message) {
        console.log(`   Error: ${result.error.message}`);
      }
    }
  }

  console.log("\n" + "═".repeat(61));

  // Summary and next steps
  const allTablesExist = requiredTables.every((t) => tableStatus[t]);

  if (allTablesExist) {
    console.log(`
✅ SUCCESS! All required tables exist.

Your database is properly configured. If you're still seeing
errors, try:
1. Refreshing your browser
2. Clearing browser cache (Ctrl+Shift+Delete)
3. Restarting your dev server

═══════════════════════════════════════════════════════════
    `);
  } else {
    const missingSql = path.join(__dirname, "../supabase-tables-setup.sql");
    const sqlExists = fs.existsSync(missingSql);

    console.log(`
❌ DATABASE SETUP REQUIRED

Missing tables: ${requiredTables.filter((t) => !tableStatus[t]).join(", ")}

═════════════════════════════════════════════════════════════
📋 QUICK FIX (5 minutes):
═════════════════════════════════════════════════════════════

1. Open Supabase SQL Editor:
   https://app.supabase.com/projects

2. Create a new query and paste this file:
   ${sqlExists ? missingSql : "supabase-tables-setup.sql (in project root)"}

3. Run the query

4. Refresh your application

═════════════════════════════════════════════════════════════
    `);

    if (sqlExists) {
      console.log("\n📄 SQL Script Contents:\n");
      const sqlContent = fs.readFileSync(missingSql, "utf-8");
      // Print first 50 lines as preview
      const lines = sqlContent.split("\n").slice(0, 50);
      lines.forEach((line) => console.log("   " + line));
      if (sqlContent.split("\n").length > 50) {
        console.log(`   ... (${sqlContent.split("\n").length - 50} more lines)`);
      }
      console.log("\n   👆 Copy ALL of this SQL and run in Supabase SQL Editor\n");
    }
  }

  console.log("═".repeat(61) + "\n");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
