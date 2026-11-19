import { extractExplicitAgriculturalCorrection, formatLearningCorrection } from "./assistantLearning";

describe("Samih agricultural correction learning", () => {
  it("captures explicit Tunisian Arabic agricultural corrections", () => {
    expect(extractExplicitAgriculturalCorrection("لا، سعر زيت الزيتون يتحسب باللتر موش بالكيلو")).toContain("زيت الزيتون");
    expect(extractExplicitAgriculturalCorrection("غلط، الطماطم في الضيعة متاعي مزروعة في مارس")).toContain("الطماطم");
  });

  it("captures explicit English and French agricultural corrections", () => {
    expect(extractExplicitAgriculturalCorrection("No, olive oil is sold per litre, not per kg")).toContain("olive oil");
    expect(extractExplicitAgriculturalCorrection("Correction: my tomato field is in Siliana")).toContain("tomato field");
    expect(extractExplicitAgriculturalCorrection("Non, le prix du blé est par quintal")).toContain("blé");
  });

  it("does not persist generic chat or non-agricultural content", () => {
    expect(extractExplicitAgriculturalCorrection("Actually, I prefer short answers")).toBeNull();
    expect(extractExplicitAgriculturalCorrection("The weather is nice today")).toBeNull();
    expect(extractExplicitAgriculturalCorrection("Correction: my phone number is 123456789; olive oil is sold by litre")).toBeNull();
    expect(extractExplicitAgriculturalCorrection("لا، رقم هاتفي ٢٢ ١٢٣ ٤٥٦، وزيت الزيتون باللتر")).toBeNull();
    expect(extractExplicitAgriculturalCorrection("لا، اتصل بيا على +216 22 123 456، زيت الزيتون باللتر")).toBeNull();
  });

  it("formats corrections as dated user feedback, not universal truth", () => {
    const line = formatLearningCorrection({
      correction_text: "زيت الزيتون باللتر",
      created_at: "2026-11-19T10:00:00.000Z",
    });
    expect(line).toContain("USER CORRECTION");
    expect(line).toContain("not a universal fact");
    expect(line).toContain("2026-11-19");
  });
});