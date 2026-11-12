/**
 * `callMicroservice` must not relay an upstream error body to the client.
 *
 * A misconfigured service, a platform proxy, or an HTML error page can carry an
 * internal host name (e.g. `http://ai-soil-analysis.internal:8001`). The proxy
 * builds a `ProviderError` whose message is returned to clients, so the body has
 * to be sanitized or dropped before it reaches them.
 */
import { callMicroservice } from "../../server/services/providers/microserviceProxy";
import { ProviderError } from "../../server/services/providers/http";

jest.mock("../../server/services/providers/serviceProbe", () => ({
  probeService: jest.fn(async () => ({
    reachable: true,
    modelSource: "field-validated-v1",
    heuristic: false,
  })),
}));

const PRIVATE_HOST = "ai-soil-analysis.internal";
const realFetch = global.fetch;

afterEach(() => {
  global.fetch = realFetch;
});

function stubBody(status: number, body: string): void {
  global.fetch = jest.fn(async () =>
    new Response(body, { status, headers: { "Content-Type": "text/html" } }),
  ) as unknown as typeof fetch;
}

describe("🔒 microservice proxy error disclosure", () => {
  test("an HTML error page is not echoed to the caller", async () => {
    stubBody(500, `<html><body>upstream error at http://${PRIVATE_HOST}:8001</body></html>`);
    await expect(
      callMicroservice({
        baseUrl: `http://${PRIVATE_HOST}:8001`,
        path: "/analyze-soil",
        capability: "soil_analysis",
        retries: 0,
      }),
    ).rejects.toThrow(ProviderError);
  });

  test("the thrown message never contains the internal host", async () => {
    stubBody(502, `proxy: cannot reach ${PRIVATE_HOST}`);
    let message = "";
    try {
      await callMicroservice({
        baseUrl: `http://${PRIVATE_HOST}:8001`,
        path: "/analyze-soil",
        capability: "soil_analysis",
        retries: 0,
      });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).not.toContain(PRIVATE_HOST);
    expect(message).toContain("HTTP 502");
  });
});
