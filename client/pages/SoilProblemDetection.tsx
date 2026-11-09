import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Legacy soil screens previously displayed fabricated sample measurements,
 * ideal profiles or alerts. Route users to the evidence-based professional
 * report instead of rendering unverified figures.
 */
export default function SoilProblemDetection() {
  return <Navigate to="/enhanced-analysis" replace />;
}
