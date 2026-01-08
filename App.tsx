
import React, { useState, useCallback, useEffect, useMemo } from 'react';
// Correctly placed import for HardDrive icon
import { HardDrive, Search, Filter, Calendar, X } from 'lucide-react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import AnalysisView from './components/AnalysisView';
import DriveSetupModal from './components/DriveSetupModal';
import { QCAnalysisResult, ReferenceFile, InspectionRecord, DriveConnection } from './types';
import { analyzeDefect } from './services/geminiService';

const CATEGORIES = [
  "전체",
  "표면 결함",
  "구조 결함",
  "외관 결함",
  "치수 결함",
  "기타 결함",
  "미분류"
];

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [driveInfo, setDriveInfo] = useState<DriveConnection>({
    isConnected: false,
    designatedSources: [],
    lastSyncTimestamp: null
  });
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QCAnalysisResult | null>(null);
  const [history, setHistory] = useState<InspectionRecord[]>([]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("전체");

  // Automatically open setup if not connected
  useEffect(() => {
    if (!driveInfo.isConnected) {
      const timer = setTimeout(() => setIsSetupOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [driveInfo.isConnected]);

  const handleImageSelect = useCallback(async (base64: string) => {
    if (!driveInfo.isConnected) {
      alert("품질 판독을 위해 먼저 지식 베이스(구글 드라이브 자료)를 지정해야 합니다.");
      setIsSetupOpen(true);
      return;
    }

    setSelectedImage(base64);
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      // Create detailed context based on designated sources
      const sourceList = driveInfo.designatedSources
        .map(s => `${s.type === 'folder' ? '[폴더]' : '[파일]'} ${s.name}`)
        .join(', ');
        
      const refContext = `사용자가 지정한 지식 베이스 소스 목록: ${sourceList}. 
        AI는 위 파일들의 내용을 인덱싱하여 품질 판독의 최우선 기준으로 삼고 있습니다. 
        만약 이미지의 결함이 위 자료 중 어느 지침에 해당하는지 명확히 밝혀주십시오.`;

      const result = await analyzeDefect(base64, refContext);
      setAnalysisResult(result);
      
      const newRecord: InspectionRecord = {
        id: `REC-${Date.now()}`,
        timestamp: Date.now(),
        imageUrl: base64,
        result
      };
      
      setHistory(prev => [newRecord, ...prev].slice(0, 50)); // Store up to 50 records
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("판독 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }, [driveInfo]);

  const handleSetupComplete = (sources: ReferenceFile[]) => {
    setDriveInfo({
      isConnected: true,
      designatedSources: sources,
      lastSyncTimestamp: Date.now()
    });
    setIsSetupOpen(false);
  };

  // Filtered History Logic
  const filteredHistory = useMemo(() => {
    return history.filter(record => {
      const matchesCategory = selectedFilterCategory === "전체" || record.result.category === selectedFilterCategory;
      const matchesSearch = record.result.defectType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.result.evidence.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.result.recommendations.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [history, searchQuery, selectedFilterCategory]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFilterCategory("전체");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Status Toast/Banner */}
        {!driveInfo.isConnected && (
          <div className="mb-8 p-5 bg-white border border-blue-100 rounded-3xl shadow-xl shadow-blue-50 flex items-center justify-between animate-bounce-subtle">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 leading-none mb-1 uppercase tracking-wider">Setup Required</p>
                <p className="text-xs text-blue-600 font-bold">노트북LM처럼 분석에 사용할 사내 드라이브 자료를 지정하세요.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSetupOpen(true)}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg"
            >
              자료 지정 시작
            </button>
          </div>
        )}

        {/* Hero Section */}
        <section className="mb-14 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white shadow-sm border border-blue-50 text-blue-700 rounded-full text-xs font-black mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            NEXT-GEN QUALITY CONTROL
          </div>
          <h2 className="text-5xl font-black text-gray-900 tracking-tighter sm:text-6xl mb-8 leading-[0.95]">
            사내 지식 기반 <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">품질 AI 판독 시스템</span>
          </h2>
          <p className="text-xl text-gray-500 max-w-xl mx-auto font-medium leading-relaxed">
            업계 최초 드라이브 다이렉트 인덱싱 기술로, <br/>
            사내 규정에 100% 부합하는 품질 판독 리포트를 제공합니다.
          </p>
        </section>

        {/* Action Section */}
        <UploadSection 
          onImageSelect={handleImageSelect}
          driveInfo={driveInfo}
          onOpenSetup={() => setIsSetupOpen(true)}
          isLoading={isLoading}
        />

        {/* Results Section */}
        <AnalysisView 
          image={selectedImage}
          result={analysisResult}
          isLoading={isLoading}
        />

        {/* History Section with Search & Filtering */}
        {history.length > 0 && (
          <section className="mt-20 border-t border-gray-100 pt-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">판독 타임라인</h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="결함명, 근거 검색..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="relative w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select 
                      value={selectedFilterCategory}
                      onChange={(e) => setSelectedFilterCategory(e.target.value)}
                      className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                {(searchQuery || selectedFilterCategory !== "전체") && (
                  <button 
                    onClick={clearFilters}
                    className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            </div>

            {filteredHistory.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {filteredHistory.map((record) => (
                  <div key={record.id} className="group bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer">
                    <div className="relative aspect-square mb-4 overflow-hidden rounded-2xl">
                      <img src={record.imageUrl} alt="이력" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg text-[8px] font-black text-blue-600 shadow-sm border border-blue-50">
                        {record.result.category}
                      </div>
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black text-white shadow-sm">
                        #{record.id.toString().slice(-4)}
                      </div>
                    </div>
                    <div className="px-1">
                      <p className="text-sm font-black text-gray-900 truncate mb-1">{record.result.defectType}</p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                        <Calendar className="w-3 h-3" />
                        {new Date(record.timestamp).toLocaleDateString('ko-KR')} • {new Date(record.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Search className="w-8 h-8" />
                </div>
                <p className="text-gray-900 font-bold">일치하는 판독 이력이 없습니다.</p>
                <p className="text-gray-400 text-sm mt-1">검색어나 카테고리 필터를 변경해 보세요.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Setup Modal */}
      {isSetupOpen && (
        <DriveSetupModal 
          onComplete={handleSetupComplete}
          onClose={() => setIsSetupOpen(false)}
        />
      )}

      <footer className="bg-white border-t border-gray-100 py-16 mt-32">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-xs">QC</div>
            <span className="font-black text-gray-900 tracking-tighter text-lg uppercase">QC Insight Pro</span>
          </div>
          <div className="flex gap-8 mb-8">
            <a href="#" className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">Service Terms</a>
            <a href="#" className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">GCP Security</a>
          </div>
          <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">© 2025 QC Insight Pro. Powered by Google Gemini Intelligence.</p>
        </div>
      </footer>
      
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default App;
