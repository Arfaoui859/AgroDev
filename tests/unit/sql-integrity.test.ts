/**
 * Database SQL integrity.
 *
 * `database/admin-role-management.sql` shipped with a corrupted dollar-quote
 * (`AS $` … `$;` instead of `AS $$` … `$$;`), so the whole file failed to parse
 * and `admin_change_user_role` — the RPC every admin role change depends on —
 * was never created on any database that applied it. The file was also absent
 * from the CI apply/verify sequence, so nothing caught it.
 *
 * These tests parse the real SQL files (no database needed) and assert the
 * structural invariants that the corruption broke.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");

function sqlFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => path.join(dir, f));
}

function dollarQuoteCounts(sql: string): { dollars: number; tags: number } {
  const dollars = (sql.match(/\$\$/g) || []).length;
  // Tagged quotes like $storage_folder$ are legitimate and must be balanced too.
  const tags = (sql.match(/\$[a-z_]+\$/g) || []).length;
  return { dollars, tags };
}

describe("database SQL integrity", () => {
  const files = [
    ...sqlFiles(path.join(root, "database")),
    ...sqlFiles(path.join(root, "database", "migrations")),
  ];

  test("every SQL file balances its dollar-quote delimiters", () => {
    for (const file of files) {
      const sql = fs.readFileSync(file, "utf8");
      const { dollars, tags } = dollarQuoteCounts(sql);
      // An odd number of $$ (or tagged) delimiters means a quote is unclosed.
      expect({ file: path.basename(file), odd: dollars % 2 !== 0 }).toEqual({
        file: path.basename(file),
        odd: false,
      });
      expect({ file: path.basename(file), odd: tags % 2 !== 0 }).toEqual({
        file: path.basename(file),
        odd: false,
      });
    }
  });

  test("no SQL file contains a bare `AS $` or `$;` line (corrupted quote)", () => {
    for (const file of files) {
      const lines = fs.readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        expect({
          file: `${path.basename(file)}:${i + 1}`,
          bad: /^\s*AS \$[^$\s]*\s*$/.test(line) || /^\s*\$\s*;/.test(line),
        }).toEqual({ file: `${path.basename(file)}:${i + 1}`, bad: false });
      });
    }
  });

  test("admin-role-management.sql defines the audited role-change RPC", () => {
    const sql = fs.readFileSync(
      path.join(root, "database", "admin-role-management.sql"),
      "utf8",
    );
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.admin_change_user_role");
    expect(sql).toContain("public.admin_audit_logs");
    expect(sql).toContain("admin_set_user_active");
  });

  test("requested_role migration clears the request on approval", () => {
    const sql = fs.readFileSync(
      path.join(root, "database", "migrations", "20261112_requested_role.sql"),
      "utf8",
    );
    expect(sql).toContain("requested_role");
    expect(sql).toContain("admin_change_user_role");
    // The approved role change must null the pending request.
    expect(sql).toMatch(/requested_role\s*=\s*NULL/);
  });

  test("CI applies and re-applies admin-role-management.sql", () => {
    const ci = fs.readFileSync(
      path.join(root, ".github", "workflows", "ci.yml"),
      "utf8",
    );
    const applies = ci.match(/admin-role-management\.sql/g) || [];
    // Once in the initial apply step, once in the idempotency step.
    expect(applies.length).toBeGreaterThanOrEqual(2);
  });
});
