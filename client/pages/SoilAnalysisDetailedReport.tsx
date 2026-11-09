import React from "react";
import { Navigate } from "react-router-dom";

/** Keep the legacy URL working while using the single maintained soil-report workflow. */
export default function SoilAnalysisDetailedReport() {
  return <Navigate to="/enhanced-analysis" replace />;
}
