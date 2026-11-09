import React from "react";
import { Navigate } from "react-router-dom";

/** Legacy soil analysis route redirects to the single evidence-based report workflow. */
export default function Analysis() {
  return <Navigate to="/enhanced-analysis" replace />;
}
