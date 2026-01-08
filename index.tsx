
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import * as lucide from 'lucide-react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// --- Types & Interfaces ---
export interface QCAnalysisResult {
  defectType: string;
  category: string;
  evidence: string;
  recommendations: string;
}

export interface ReferenceFile {
  id: string;
  name: string;
  type: 'image' | 'text' | 'pdf' | 'folder';
  size?: string;
  lastModified?: string;
  path?: string;
}

export interface InspectionRecord {
  id: string;
  timestamp: number;
  imageUrl: string;
  result: QCAnalysisResult;
}

export interface DriveConnection {
  isConnected: boolean;
  designatedSources: ReferenceFile[];
  lastSyncTimestamp: number | null;
}

const CATEGORIES = [
  "전체",
  "표면 결함",
  "구조 결함",
  "외관 결함",
  "치수 결함",
  "기타 결함",
  "미분류"
];

// --- Services ---
const analyzeDefect = async (
  base64Image: string,
  referenceData?: string
): Promise<QCAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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

// --- Components ---

const Header: React.FC = () => (
  <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">QC</div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          QC Insight <span className="text-blue-600">Pro</span>
        </h1>
      </div>
      <nav className="hidden md:flex space-x-8">
        <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900">대시보드</a>
        <a href="#" className="text-sm font-medium text-blue-600">신규 판독</a>
        <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900">판독 이력</a>
        <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900">지식 베이스</a>
      </nav>
      <div className="flex items-center gap-4">
        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">System Online</span>
      </div>
    </div>
  </header>
);

const DriveSetupModal: React.FC<{ onComplete: (sources: ReferenceFile[]) => void; onClose: () => void; }> = ({ onComplete, onClose }) => {
  const [step, setStep] = useState<'auth' | 'designate'>('auth');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const MOCK_DRIVE_CONTENTS: ReferenceFile[] = [
    { id: 'f1', name: '2024_생산라인_표준_매뉴얼', type: 'folder', lastModified: '2024-12-01' },
    { id: 'f2', name: '품질관리_결함_데이터베이스', type: 'folder', lastModified: '2025-01-15' },
    { id: 'ref1', name: 'A구역_용접_불량_판독기준.pdf', type: 'pdf', size: '2.4MB', lastModified: '2025-02-10' },
    { id: 'ref2', name: '사출성형_기포_발생_사례.txt', type: 'text', size: '15KB', lastModified: '2024-11-20' },
    { id: 'ref3', name: '스크래치_허용_범위_이미지.img', type: 'image', size: '4.1MB', lastModified: '2025-01-05' },
    { id: 'ref4', name: 'B라인_조립_체크리스트.pdf', type: 'pdf', size: '1.2MB', lastModified: '2025-02-28' },
  ];

  const handleAuth = () => {
    setIsProcessing(true);
    setTimeout(() => { setStep('designate'); setIsProcessing(false); }, 1200);
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedIds(newSelection);
  };

  const handleConfirmDesignation = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onComplete(MOCK_DRIVE_CONTENTS.filter(item => selectedIds.has(item.id)));
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white"><lucide.HardDrive className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-none">지식 베이스 지정</h2>
              <p className="text-[11px] text-blue-600 font-medium mt-1">Google Drive Archive</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 text-2xl">&times;</button>
        </div>
        <div className="p-8">
          {step === 'auth' ? (
            <div className="text-center py-6 space-y-8">
              <div className="flex justify-center items-center gap-4">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-10 h-10" alt="Drive" />
                </div>
                <div className="h-px w-12 bg-gray-200" />
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">QC</div>
                </div>
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">드라이브 지식 베이스 연동</h3>
                <p className="text-gray-500 text-sm leading-relaxed">분석에 필요한 사내 품질 매뉴얼, 결함 사례집 폴더 및 파일을 선택하여 AI의 판독 근거로 지정합니다.</p>
              </div>
              <button onClick={handleAuth} disabled={isProcessing} className="w-full max-w-sm mx-auto bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 flex items-center justify-center gap-3">
                {isProcessing ? <lucide.Loader2 className="w-5 h-5 animate-spin" /> : <><lucide.ExternalLink className="w-5 h-5" />구글 드라이브 접근 권한 허용</>}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div><h3 className="text-lg font-bold text-gray-900">자료 선택</h3><p className="text-xs text-gray-500">분석 시 근거로 사용할 파일이나 폴더를 체크하세요.</p></div>
                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">{selectedIds.size}개 선택됨</div>
              </div>
              <div className="relative">
                <lucide.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="파일명 또는 폴더명 검색..." className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="max-h-[320px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {MOCK_DRIVE_CONTENTS.map((item) => (
                  <div key={item.id} onClick={() => toggleSelection(item.id)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${selectedIds.has(item.id) ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'folder' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                        {item.type === 'folder' ? <lucide.Folder className="w-5 h-5 fill-current" /> : <lucide.FileText className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-bold ${selectedIds.has(item.id) ? 'text-blue-700' : 'text-gray-800'}`}>{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{item.type === 'folder' ? '폴더' : item.size} • 수정일: {item.lastModified}</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.has(item.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 group-hover:border-blue-300'}`}>
                      {selectedIds.has(item.id) && <lucide.Check className="w-3 h-3 stroke-[4]" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setStep('auth')} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl">이전</button>
                <button onClick={handleConfirmDesignation} disabled={isProcessing || selectedIds.size === 0} className="flex-[2] bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black flex items-center justify-center gap-2">
                  {isProcessing ? <lucide.Loader2 className="w-5 h-5 animate-spin" /> : <>지식 베이스로 추가하기<lucide.ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UploadSection: React.FC<{ onImageSelect: (b: string) => void; driveInfo: DriveConnection; onOpenSetup: () => void; isLoading: boolean; }> = ({ onImageSelect, driveInfo, onOpenSetup, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onImageSelect(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative group">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><lucide.Camera className="w-5 h-5" /></div>
              검사 이미지 판독
            </h2>
            <span className="text-[10px] font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded-lg">Real-time Analysis</span>
          </div>
          <div onClick={() => !isLoading && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-14 flex flex-col items-center justify-center cursor-pointer transition-all ${isLoading ? 'bg-gray-50 border-gray-200' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/50'}`}>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" disabled={isLoading} />
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-200 group-hover:scale-110 transition-transform"><lucide.Upload className="w-10 h-10 text-white" /></div>
            <p className="text-gray-900 font-bold text-lg mb-1">여기를 클릭하여 이미지 업로드</p>
            <p className="text-gray-400 text-sm">또는 파일을 이 창으로 드래그 하세요</p>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><lucide.HardDrive className="w-5 h-5" /></div>
              지식 베이스
            </h2>
            <button onClick={onOpenSetup} className="p-2 hover:bg-gray-50 text-gray-400 rounded-xl transition-all"><lucide.Settings2 className="w-5 h-5" /></button>
          </div>
          {!driveInfo.isConnected ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-indigo-100 rounded-2xl bg-indigo-50/20">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-300 mb-4"><lucide.ShieldCheck className="w-8 h-8" /></div>
              <p className="text-sm font-bold text-indigo-900 mb-2">연동된 자료가 없습니다</p>
              <button onClick={onOpenSetup} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold">자료 지정하기</button>
            </div>
          ) : (
            <div className="space-y-5 flex-grow overflow-hidden flex flex-col">
              <div className="flex items-center justify-between bg-green-50 border border-green-100 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center"><lucide.CheckCircle className="w-5 h-5 text-green-500" /></div>
                  <div><p className="text-[11px] font-black text-green-800 uppercase leading-none">Status</p><p className="text-[10px] text-green-600 mt-1 font-bold">동기화 활성화됨</p></div>
                </div>
                <div className="text-[10px] text-green-700 font-bold bg-white/50 px-2 py-1 rounded">{driveInfo.designatedSources.length} Sources</div>
              </div>
              <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {driveInfo.designatedSources.map((source) => (
                  <div key={source.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${source.type === 'folder' ? 'bg-amber-100 text-amber-600' : 'bg-white text-gray-400 shadow-sm'}`}>
                      {source.type === 'folder' ? <lucide.Folder className="w-4 h-4 fill-current" /> : <lucide.FileText className="w-4 h-4" />}
                    </div>
                    <div className="flex-grow min-w-0"><p className="text-[11px] font-bold text-gray-800 truncate">{source.name}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AnalysisView: React.FC<{ image: string | null; result: QCAnalysisResult | null; isLoading: boolean; }> = ({ image, result, isLoading }) => {
  if (!image && !isLoading) return null;
  return (
    <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-6 bg-gray-900 flex items-center justify-center min-h-[400px]">
          {image && (
            <div className="relative w-full h-full max-h-[500px] flex items-center justify-center">
              <img src={image} alt="검사 대상" className={`max-w-full max-h-full rounded shadow-2xl object-contain ${isLoading ? 'opacity-50' : 'opacity-100'}`} />
              {isLoading && <div className="absolute inset-0 flex flex-col items-center justify-center text-white"><lucide.Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" /><p className="text-lg font-medium animate-pulse">패턴 분석 및 매뉴얼 대조 중...</p></div>}
            </div>
          )}
        </div>
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="text-xl font-bold flex items-center gap-2"><lucide.ClipboardList className="w-6 h-6 text-blue-600" />품질 관리 판독 리포트</h3>
          </div>
          {result ? (
            <div className="space-y-6">
              <section>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><lucide.AlertCircle className="w-5 h-5 text-red-500" /><h4 className="font-bold text-gray-900">[결함 유형]</h4></div>
                  <span className="flex items-center gap-1 text-[11px] font-black bg-gray-100 text-gray-600 px-2 py-1 rounded-lg"><lucide.Tag className="w-3 h-3" />{result.category}</span>
                </div>
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl"><p className="text-red-900 font-semibold">{result.defectType}</p></div>
              </section>
              <section>
                <div className="flex items-center gap-2 mb-2"><lucide.ShieldCheck className="w-5 h-5 text-blue-500" /><h4 className="font-bold text-gray-900">[유사 사례 근거]</h4></div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl"><p className="text-blue-900 text-sm leading-relaxed">{result.evidence}</p></div>
              </section>
              <section>
                <div className="flex items-center gap-2 mb-2"><lucide.Lightbulb className="w-5 h-5 text-amber-500" /><h4 className="font-bold text-gray-900">[권장 조치 사항]</h4></div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl whitespace-pre-wrap"><p className="text-amber-900 text-sm leading-relaxed">{result.recommendations}</p></div>
              </section>
              <div className="pt-4 flex gap-3">
                <button className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">리포트 PDF 저장</button>
              </div>
            </div>
          ) : <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20"><lucide.Loader2 className="w-8 h-8 animate-spin" /><p className="mt-4">분석 결과를 기다리는 중입니다...</p></div>}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [driveInfo, setDriveInfo] = useState<DriveConnection>({ isConnected: false, designatedSources: [], lastSyncTimestamp: null });
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QCAnalysisResult | null>(null);
  const [history, setHistory] = useState<InspectionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("전체");

  useEffect(() => { if (!driveInfo.isConnected) setTimeout(() => setIsSetupOpen(true), 800); }, [driveInfo.isConnected]);

  const handleImageSelect = useCallback(async (base64: string) => {
    if (!driveInfo.isConnected) { alert("품질 판독을 위해 먼저 지식 베이스를 지정해야 합니다."); setIsSetupOpen(true); return; }
    setSelectedImage(base64);
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const sourceList = driveInfo.designatedSources.map(s => `${s.type === 'folder' ? '[폴더]' : '[파일]'} ${s.name}`).join(', ');
      const refContext = `사용자가 지정한 지식 베이스 소스 목록: ${sourceList}. AI는 위 파일들의 내용을 인덱싱하여 품질 판독의 최우선 기준으로 삼고 있습니다.`;
      const result = await analyzeDefect(base64, refContext);
      setAnalysisResult(result);
      setHistory(prev => [{ id: `REC-${Date.now()}`, timestamp: Date.now(), imageUrl: base64, result }, ...prev].slice(0, 50));
    } catch (error) { alert("판독 중 오류가 발생했습니다."); } finally { setIsLoading(false); }
  }, [driveInfo]);

  const filteredHistory = useMemo(() => {
    return history.filter(record => {
      const matchesCategory = selectedFilterCategory === "전체" || record.result.category === selectedFilterCategory;
      const matchesSearch = record.result.defectType.toLowerCase().includes(searchQuery.toLowerCase()) || record.result.evidence.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [history, searchQuery, selectedFilterCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {!driveInfo.isConnected && (
          <div className="mb-8 p-5 bg-white border border-blue-100 rounded-3xl shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white"><lucide.HardDrive className="w-6 h-6" /></div><div><p className="text-sm font-black text-gray-900 leading-none mb-1 uppercase tracking-wider">Setup Required</p><p className="text-xs text-blue-600 font-bold">노트북LM처럼 분석에 사용할 사내 드라이브 자료를 지정하세요.</p></div></div>
            <button onClick={() => setIsSetupOpen(true)} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black shadow-lg">자료 지정 시작</button>
          </div>
        )}
        <section className="mb-14 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white shadow-sm border border-blue-50 text-blue-700 rounded-full text-xs font-black mb-6"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span></span>NEXT-GEN QUALITY CONTROL</div>
          <h2 className="text-5xl font-black text-gray-900 tracking-tighter sm:text-6xl mb-8 leading-[0.95]">사내 지식 기반 <br/><span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">품질 AI 판독 시스템</span></h2>
          <p className="text-xl text-gray-500 max-w-xl mx-auto font-medium leading-relaxed">업계 최초 드라이브 다이렉트 인덱싱 기술로, 사내 규정에 100% 부합하는 품질 판독 리포트를 제공합니다.</p>
        </section>
        <UploadSection onImageSelect={handleImageSelect} driveInfo={driveInfo} onOpenSetup={() => setIsSetupOpen(true)} isLoading={isLoading} />
        <AnalysisView image={selectedImage} result={analysisResult} isLoading={isLoading} />
        {history.length > 0 && (
          <section className="mt-20 border-t border-gray-100 pt-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6"><h3 className="text-2xl font-black text-gray-900 tracking-tight">판독 타임라인</h3>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64 group"><lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="결함명, 근거 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" /></div>
                <div className="relative w-full sm:w-auto"><lucide.Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /><select value={selectedFilterCategory} onChange={(e) => setSelectedFilterCategory(e.target.value)} className="appearance-none bg-white border border-gray-200 rounded-xl px-10 py-2.5 text-sm font-bold text-gray-700 outline-none cursor-pointer">{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
              </div>
            </div>
            {filteredHistory.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {filteredHistory.map((record) => (
                  <div key={record.id} className="group bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer">
                    <div className="relative aspect-square mb-4 overflow-hidden rounded-2xl"><img src={record.imageUrl} alt="이력" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /><div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg text-[8px] font-black text-blue-600 shadow-sm border border-blue-50">{record.result.category}</div></div>
                    <div className="px-1"><p className="text-sm font-black text-gray-900 truncate mb-1">{record.result.defectType}</p><div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium"><lucide.Calendar className="w-3 h-3" />{new Date(record.timestamp).toLocaleDateString('ko-KR')}</div></div>
                  </div>
                ))}
              </div>
            ) : <div className="py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200"><p className="text-gray-900 font-bold">일치하는 판독 이력이 없습니다.</p></div>}
          </section>
        )}
      </main>
      {isSetupOpen && <DriveSetupModal onComplete={(s) => { setDriveInfo({ isConnected: true, designatedSources: s, lastSyncTimestamp: Date.now() }); setIsSetupOpen(false); }} onClose={() => setIsSetupOpen(false)} />}
      <footer className="bg-white border-t border-gray-100 py-16 mt-32">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-xs">QC</div><span className="font-black text-gray-900 tracking-tighter text-lg uppercase">QC Insight Pro</span></div>
          <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">© 2025 QC Insight Pro. Powered by Google Gemini Intelligence.</p>
        </div>
      </footer>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
