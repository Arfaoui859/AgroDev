import { fetchFarmNdvi } from "../../server/services/satellite/sentinelHub";

describe("Sentinel Hub farm NDVI client", () => {
  afterEach(() => {
    delete process.env.COPERNICUS_CLIENT_ID;
    delete process.env.COPERNICUS_CLIENT_SECRET;
  });

  test("rejects missing or unsupported farm geometry before calling Copernicus", async () => {
    await expect(fetchFarmNdvi(null, 90)).rejects.toThrow("VALID_FARM_GEOJSON_BOUNDARY_REQUIRED");
    await expect(fetchFarmNdvi({ type: "Point", coordinates: [10, 36] }, 90))
      .rejects.toThrow("VALID_FARM_GEOJSON_BOUNDARY_REQUIRED");
  });

  test("requires a supported observation period", async () => {
    const polygon = {
      type: "Polygon",
      coordinates: [[[10, 36], [10.01, 36], [10.01, 36.01], [10, 36.01], [10, 36]]],
    };
    await expect(fetchFarmNdvi(polygon, 45)).rejects.toThrow("INVALID_SATELLITE_PERIOD");
  });

  test("does not call external APIs without server-side Copernicus credentials", async () => {
    delete process.env.COPERNICUS_CLIENT_ID;
    delete process.env.COPERNICUS_CLIENT_SECRET;
    const polygon = {
      type: "Polygon",
      coordinates: [[[10, 36], [10.01, 36], [10.01, 36.01], [10, 36.01], [10, 36]]],
    };
    await expect(fetchFarmNdvi(polygon, 90)).rejects.toThrow("SATELLITE_CREDENTIALS_NOT_CONFIGURED");
  });
});
