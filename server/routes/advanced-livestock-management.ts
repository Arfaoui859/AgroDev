import type { Request, Response } from 'express';

/**
 * This module previously generated livestock records and calculated health,
 * breeding and feed outputs from hard-coded example animals. Those outputs
 * were not backed by a verified farm data store and must not be presented as
 * real farm intelligence.
 *
 * Keep the exported handlers for existing route registrations, but fail
 * closed until authenticated, tenant-scoped persistence and validated
 * veterinary/feed rules are connected.
 */
function unavailable(_req: Request, res: Response): void {
  res.setHeader('X-AgroGrowth-Data-Status', 'unavailable');
  res.setHeader('X-AgroGrowth-Data-Provenance', 'unverified');
  res.status(503).json({
    success: false,
    code: 'LIVESTOCK_DATA_STORE_NOT_CONNECTED',
    message: 'Livestock records and validated analysis are not currently available.',
    data: null,
    provenance: {
      source: null,
      verified: false,
      model_source: null,
    },
  });
}

export async function getAnimals(req: Request, res: Response): Promise<void> {
  unavailable(req, res);
}

export async function getAnimalHealth(req: Request, res: Response): Promise<void> {
  unavailable(req, res);
}

export async function getBreedingRecommendations(req: Request, res: Response): Promise<void> {
  unavailable(req, res);
}

export async function getFeedRecommendations(req: Request, res: Response): Promise<void> {
  unavailable(req, res);
}

export async function optimizeFeedBudget(req: Request, res: Response): Promise<void> {
  unavailable(req, res);
}

export async function getHealthAlerts(req: Request, res: Response): Promise<void> {
  unavailable(req, res);
}

export async function getLivestockDashboard(req: Request, res: Response): Promise<void> {
  unavailable(req, res);
}
