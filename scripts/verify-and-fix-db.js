#!/usr/bin/env node

/**
 * Read-only Supabase schema visibility check.
 *
 * This script never writes rows, lists Auth users, applies SQL, or uses the
 * service-role key. It only checks whether the configured project exposes the
 * expected tables to the supplied anon client. RLS/tenant isolation needs the
 * separate database integration tests and cannot be proven by this script.
 *
 * Usage: node scripts/verify-and-fix-db.js
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Configuration missing. Set SUPABASE_URL and SUPABASE_ANON_KEY in the local environment.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function checkTable(tableName) {
  try {
    const { error } = await supabase.from(tableName).select("id").limit(0);
    if (!error) return { exists: true, accessible: true, error: null };

    const missingTable =
      error.code === "PGRST205" ||
      /could not find the table|does not exist/i.test(error.message || "");

    return {
      exists: !missingTable,
      accessible: false,
      error: {
        code: error.code || "UNKNOWN",
        message: missingTable
          ? "Table not found in the configured project's exposed schema."
          : "Table may exist, but the anon role cannot access it; verify RLS/policies.",
      },
    };
  } catch (error) {
    return {
      exists: false,
      accessible: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown connection error",
      },
    };
  }
}

async function main() {
  console.log("AgroGrowth — read-only Supabase schema check");
  console.log("Project URL:", supabaseUrl);
  console.log("Credential: anon/public key only; no service-role key used.");
  console.log("");

  const requiredTables = ["users", "user_profiles"];
  let missing = false;
  let inaccessible = false;

  for (const table of requiredTables) {
    const result = await checkTable(table);
    if (!result.exists) {
      missing = true;
      console.error(`MISSING: ${table}`);
    } else if (!result.accessible) {
      inaccessible = true;
      console.warn(`EXISTS/NOT ACCESSIBLE: ${table}`);
      console.warn(`  ${result.error?.message}`);
    } else {
      console.log(`VISIBLE: ${table}`);
    }
  }

  console.log("");
  if (missing) {
    console.error("One or more required tables were not found.");
    console.error("Review DATABASE_SETUP.md and the versioned SQL files in database/.");
    process.exitCode = 1;
  } else if (inaccessible) {
    console.warn("Table visibility is incomplete. Review grants and RLS policies.");
    console.warn("This script does not attempt to bypass RLS or modify the project.");
    process.exitCode = 2;
  } else {
    console.log("Required tables are visible to the anon client.");
    console.log("This does NOT prove Auth lifecycle, RLS isolation or production readiness.");
  }
}

main().catch((error) => {
  console.error(
    "Supabase check failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
