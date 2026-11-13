/**
 * Guard: the browser must never talk to the AI microservice hosts directly.
 *
 * The backend gateway (`/api/ai/*`) is the only place that tags provenance and
 * fails closed for synthetic/unverified models. If a client module reads a
 * `VITE_*_URL` microservice hostname and fetches it, it bypasses that gate and
 * could surface synthetic output as a real result. It also silently breaks in
 * production, where those variables are unset (see the CloudServicesStatus
 * regression).
 *
 * The `VITE_*_URL` names below are intentionally NOT `VITE_API_URL` (the
 * backend base) or `VITE_SUPABASE_URL` (Supabase).
 */
import fs from "node:fs";
import path from "node:path";

const CLIENT_DIR = path.join(__dirname, "..", "..", "client");

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const MICROSERVICE_URL_VARS = [
  "VITE_SOIL_ANALYSIS_URL",
  "VITE_CROP_RECOMMENDATION_URL",
  "VITE_IMAGE_DIAGNOSIS_URL",
  "VITE_MARKET_PREDICTION_URL",
  "VITE_INTELLIGENT_AGENT_URL",
  "VITE_PEST_CONTROL_URL",
  "VITE_IRRIGATION_OPTIMIZATION_URL",
  "VITE_WEATHER_YIELD_INTELLIGENCE_URL",
];

describe("client never calls AI microservice hosts directly", () => {
  const files = walk(CLIENT_DIR);

  test("no client module reads a microservice VITE_*_URL hostname", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      for (const name of MICROSERVICE_URL_VARS) {
        if (source.includes(name)) {
          offenders.push(`${path.relative(CLIENT_DIR, file)} → ${name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  test("cloud-config exposes only the backend base URL", () => {
    const source = fs.readFileSync(
      path.join(CLIENT_DIR, "lib", "cloud-config.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/checkServiceHealth/);
    expect(source).not.toMatch(/checkAllServicesHealth/);
    expect(source).not.toMatch(/robustCloudFetch/);
    expect(source).toMatch(/apiBaseUrl/);
  });
});
