/**
 * Soil advisory provenance is explicit; no provider means no report.
 */
import request from "supertest";
import express from "express";

const ENV_KEYS=["AI_PROVIDER","AI_BASE_URL","AI_API_KEY","AI_MODEL","OPENAI_API_KEY","OPENAI_BASE_URL","GEMINI_API_KEY"];
const saved:Record<string,string|undefined>={};
describe("Detailed soil analysis provenance",()=>{
  let app:express.Application;
  beforeAll(()=>{
    for(const key of ENV_KEYS){saved[key]=process.env[key];delete process.env[key];}
    jest.resetModules();
    const {createServer}=require("../../server/index");
    app=createServer();
  });
  afterAll(()=>{for(const key of ENV_KEYS){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}});
  test("does not fabricate a report when no LLM provider is configured",async()=>{
    const res=await request(app).post("/api/soil-analysis/analyze").send({ph:7.2,moisture:28,nitrogen:40}).expect(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("AI_PROVIDER_UNAVAILABLE");
  });
  test("batch endpoint fails closed when no provider is configured",async()=>{
    const res=await request(app).post("/api/soil-analysis/batch").send({soils:[{ph:6.8,moisture:31},{ph:7.9,moisture:22}]}).expect(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("AI_PROVIDER_UNAVAILABLE");
  });
  test("batch validation rejects malformed payloads",async()=>{
    await request(app).post("/api/soil-analysis/batch").send({soils:[]}).expect(400);
    await request(app).post("/api/soil-analysis/batch").send({soils:"no"}).expect(400);
  });
  test("report lookup fails clearly when no authenticated database session is available",async()=>{
    const res=await request(app).get("/api/soil-analysis/report/never-stored").expect(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("DATABASE_OR_SESSION_UNAVAILABLE");
  });

  test("soil analysis endpoints reject anonymous production requests",async()=>{
    const previousEnv=process.env.NODE_ENV;
    const previousDemo=process.env.ENABLE_DEMO_ENDPOINTS;
    process.env.NODE_ENV="production";
    delete process.env.ENABLE_DEMO_ENDPOINTS;
    try {
      await request(app).post("/api/soil-analysis/analyze").send({ph:7,moisture:30}).expect(401);
      await request(app).get("/api/soil-analysis/report/never-stored").expect(401);
    } finally {
      if(previousEnv===undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV=previousEnv;
      if(previousDemo===undefined) delete process.env.ENABLE_DEMO_ENDPOINTS; else process.env.ENABLE_DEMO_ENDPOINTS=previousDemo;
    }
  });
});
