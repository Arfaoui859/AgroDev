/**
 * Detailed soil report must use the configured LLM and disclose advisory provenance.
 */
import request from "supertest";
import express from "express";

const ENV_KEYS = ["AI_PROVIDER","AI_BASE_URL","AI_API_KEY","AI_MODEL","OPENAI_API_KEY","OPENAI_BASE_URL","GEMINI_API_KEY"] as const;
const saved: Record<string,string|undefined> = {};
const realFetch = global.fetch;

function clearProviderEnv() {
  for (const key of ENV_KEYS) {
    if (!(key in saved)) saved[key] = process.env[key];
    delete process.env[key];
  }
}
function stubProviderJson(payload: unknown) {
  global.fetch = jest.fn(async () => new Response(JSON.stringify({
    choices:[{message:{role:"assistant",content:JSON.stringify(payload)}}],
    usage:{prompt_tokens:10,completion_tokens:20,total_tokens:30},
  }),{status:200,headers:{"Content-Type":"application/json"}})) as unknown as typeof fetch;
}
const validReport = {
  schemaVersion:"1.0",reportLanguage:"ar-TN",executiveSummary:"تفسير مبني على القياسات المقدمة.",
  dataQuality:{providedMeasurements:[],missingMeasurements:[],limitations:[]},
  soilCharacterization:{texture:{classification:"غير محدد",basis:"not assessed",confidence:"qualitative only"},chemical:[],physical:[]},
  findings:[],strengths:[],constraints:[],
  cropSuitability:{status:"not_assessed",candidates:[],caveats:["المعطيات غير كافية"]},
  recommendations:[],followUpPlan:[],additionalInformationNeeded:[],
  professionalReview:{required:true,reason:"يلزم التثبت المخبري",bringToAgronomist:[]},disclaimers:[],
};

describe("Detailed soil analysis with a configured provider",()=>{
  let app:express.Application;
  beforeEach(()=>{
    clearProviderEnv();jest.resetModules();
    process.env.AI_API_KEY="test-key";
    process.env.AI_BASE_URL="https://api.openai.com/v1";
    process.env.AI_MODEL="test-model";
    const {createServer}=require("../../server/index");
    app=createServer();
  });
  afterEach(()=>{global.fetch=realFetch;});
  afterAll(()=>{for(const key of ENV_KEYS){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}});

  test("returns the structured report with honest LLM-advisory provenance",async()=>{
    stubProviderJson(validReport);
    const res=await request(app).post("/api/soil-analysis/analyze").send({ph:6.9,moisture:30}).expect(200);
    expect(res.headers["x-is-real-data"]).toBe("false");
    expect(res.headers["x-data-provenance"]).toBe("ai-advisory");
    expect(res.body.isRealData).toBe(false);
    expect(res.body.dataSource).toBe("ai-advisory");
    expect(res.body.provenance.advisory).toBe("llm-generated");
    expect(res.body.provenance.mlPrediction).toBe("not-available");
    expect(res.body.persistence).toEqual({ persisted: false, reason: "FIELD_NOT_SELECTED" });
    expect(res.body.analysisId).toBeUndefined();
    expect(res.body.data.executiveSummary).toContain("القياسات");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("server rebuilds the provided-measurements evidence from the submitted sample",async()=>{
    const untrustedReport = {
      ...validReport,
      dataQuality: {
        ...validReport.dataQuality,
        providedMeasurements: [{
          name:"invented measurement", value:999, unit:"kg/ha", source:"llm",
        }],
      },
    };
    stubProviderJson(untrustedReport);
    const res = await request(app).post("/api/soil-analysis/analyze")
      .send({ph:6.9,moisture:30,organicMatter:2.4,nitrogen:18,nutrientUnit:"mg/kg"})
      .expect(200);

    expect(res.body.data.dataQuality.providedMeasurements).toEqual([
      {name:"pH",value:6.9,unit:"unitless",source:"user-entered-unverified"},
      {name:"رطوبة التربة",value:30,unit:"%",source:"user-entered-unverified"},
      {name:"المادة العضوية",value:2.4,unit:"%",source:"user-entered-unverified"},
      {name:"النيتروجين (N)",value:18,unit:"mg/kg",source:"user-entered-unverified"},
    ]);
    expect(JSON.stringify(res.body.data.dataQuality.providedMeasurements))
      .not.toContain("invented measurement");
  });

  test("provider failure is surfaced without fabricating a report",async()=>{
    global.fetch=jest.fn(async()=>new Response(JSON.stringify({error:{message:"upstream 500"}}),{status:500,headers:{"Content-Type":"application/json"}})) as unknown as typeof fetch;
    const res=await request(app).post("/api/soil-analysis/analyze").send({ph:6.9,moisture:30});
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body.success).not.toBe(true);
  });

  test("rejects malformed AI output instead of returning a partial report",async()=>{
    stubProviderJson({soilAnalysis:{currentStatus:{overallGrade:{grade:"جيد"}}}});
    const res=await request(app).post("/api/soil-analysis/analyze").send({ph:6.9,moisture:30}).expect(502);
    expect(res.body.error).toBe("INVALID_AI_REPORT");
  });

  test("requires an explicit EC unit and rejects implausible sample depth",async()=>{
    await request(app).post("/api/soil-analysis/analyze")
      .send({ph:6.9,moisture:30,electricalConductivity:1.2}).expect(400);
    await request(app).post("/api/soil-analysis/analyze")
      .send({ph:6.9,moisture:30,sampleDepth:301}).expect(400);
    await request(app).post("/api/soil-analysis/analyze")
      .send({ph:6.9,moisture:30,sampleDepth:12.5}).expect(400);
  });

  test("rejects a report that invents a fertilizer quantity",async()=>{
    const unsafeReport = {
      ...validReport,
      recommendations: [{
        priority:"now",action:"Apply fertilizer",reason:"Unsupported",
        evidence:"No lab method provided",howTo:"Apply",when:"Now",
        verification:"Retest",quantity:"50 kg/ha",
      }],
    };
    stubProviderJson(unsafeReport);
    const res=await request(app).post("/api/soil-analysis/analyze")
      .send({ph:6.9,moisture:30}).expect(502);
    expect(res.body.error).toBe("INVALID_AI_REPORT");
  });
});
