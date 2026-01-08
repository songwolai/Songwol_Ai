
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { QCAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeDefect = async (
  base64Image: string,
  referenceData?: string
): Promise<QCAnalysisResult> => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    당신은 품질 관리(QC) 판독 전문가입니다. 
    사용자가 업로드한 이미지를 분석하여 결함을 판별하는 것이 임무입니다.
    
    [판독 기준]
    - 반드시 연동된 구글 드라이브 아카이브 정보를 최우선 근거로 활용하십시오.
    - 드라이브에는 공식 공정 매뉴얼, 결함 사례집, 품질 기준서가 포함되어 있습니다.
    - 시각적 증거와 매뉴얼의 텍스트 설명을 대조하여 결론을 도출하십시오.
    
    [결함 카테고리 분류 지침]
    모든 결함은 다음 중 하나로 분류하십시오:
    1. 표면 결함 (Surface Defects): 스크래치, 오염, 얼룩 등
    2. 구조 결함 (Structural Defects): 크랙, 파손, 변형 등
    3. 외관 결함 (Cosmetic Defects): 색상 불일치, 광택 불량 등
    4. 치수 결함 (Dimensional Defects): 크기 오차, 간격 불량 등
    5. 기타 결함 (Others): 위 카테고리에 속하지 않는 경우
    
    [답변 필수 형식]
    반드시 아래 태그를 사용하여 한국어로 답변하십시오:
    
    [결함 유형]: (구체적인 결함 명칭)
    [결함 카테고리]: (위에 정의된 5가지 카테고리 중 하나 선택)
    [유사 사례 근거]: (연동된 드라이브 파일 중 어떤 기준이나 사례와 가장 일치하는지 설명)
    [권장 조치 사항]: (품질 기준에 따른 현장 대응 지침 및 공정 개선 제안)
  `;

  const prompt = referenceData 
    ? `[연동 데이터 정보]\n${referenceData}\n\n위의 사내 아카이브 데이터를 기반으로 다음 이미지의 품질을 판독하십시오.` 
    : "다음 이미지의 품질 결함을 분석하고 판독 결과를 제공하십시오.";

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1],
    },
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      systemInstruction,
      temperature: 0.1,
      topP: 0.9,
    },
  });

  const text = response.text || "";
  
  // Robust parsing of the structured response
  const defectTypeMatch = text.match(/\[결함 유형\]\s*:\s*(.*?)(\n|\[|$)/);
  const categoryMatch = text.match(/\[결함 카테고리\]\s*:\s*(.*?)(\n|\[|$)/);
  const evidenceMatch = text.match(/\[유사 사례 근거\]\s*:\s*(.*?)(\n|\[|$)/);
  const recommendationsMatch = text.match(/\[권장 조치 사항\]\s*:\s*([\s\S]*)/);

  return {
    defectType: defectTypeMatch ? defectTypeMatch[1].trim() : "미판별 (분석 데이터 부족)",
    category: categoryMatch ? categoryMatch[1].trim() : "미분류",
    evidence: evidenceMatch ? evidenceMatch[1].trim() : "드라이브 데이터와 일치하는 사례를 찾을 수 없음",
    recommendations: recommendationsMatch ? recommendationsMatch[1].trim() : "현장 관리자 확인 필요",
  };
};
