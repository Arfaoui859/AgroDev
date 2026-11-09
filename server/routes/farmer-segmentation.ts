import type { Request, Response } from 'express';

/**
 * The previous implementation returned generated demonstration records.
 * Preserve route-handler exports while refusing to present unverified data
 * until a real authenticated persistence layer is connected.
 */
function unavailable(_req: Request, res: Response): void {
  res.setHeader('X-AgroGrowth-Data-Status', 'unavailable');
  res.setHeader('X-AgroGrowth-Data-Provenance', 'unverified');
  res.status(503).json({
    success: false,
    code: 'DASHBOARD_DATA_SOURCE_NOT_CONNECTED',
    message: 'Verified records are not available until the persistent data source is connected.',
    data: null,
    provenance: { source: null, verified: false, model_source: null },
  });
}

export async function getFarmerSegments(req: Request, res: Response): Promise<void> {
  unavailable(req, res);
}

export async function segmentFarmer(req: Request, res: Response): Promise<void> {
  unavailable(req, res);
}

export async function getAllFarmersSegmentation(req: Request, res: Response): Promise<void> {
  unavailable(req, res);
}

export async function getSegmentationAnalytics(req: Request, res: Response): Promise<void> {
  unavailable(req, res);
}

export async function updateFarmerProfile(req: Request, res: Response): Promise<void> {
  unavailable(req, res);
}
