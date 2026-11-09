import express from 'express';

/**
 * The former dashboard generated unverified demonstration records.
 * It remains mounted for API compatibility but fails closed until this
 * dashboard is backed by authenticated, tenant-scoped persisted data.
 */
const router = express.Router();

router.use((_req, res) => {
  res.setHeader('X-AgroGrowth-Data-Status', 'unavailable');
  res.setHeader('X-AgroGrowth-Data-Provenance', 'unverified');
  res.status(503).json({
    success: false,
    code: 'DASHBOARD_DATA_SOURCE_NOT_CONNECTED',
    message: 'Verified dashboard data is not available until its persistent data source is connected.',
    data: null,
    provenance: { source: null, verified: false, model_source: null },
  });
});

export default router;
