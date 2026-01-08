
import React, { useState, useCallback, useEffect } from 'react';
// Correctly placed import for HardDrive icon
import { HardDrive } from 'lucide-react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import AnalysisView from './components/AnalysisView';
import DriveSetupModal from './components/DriveSetupModal';
import { QCAnalysisResult, ReferenceFile, InspectionRecord, DriveConnection } from './types';
import { analyzeDefect } from './services/geminiService';

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
      
      setHistory(prev => [newRecord, ...prev].slice(0, 10));
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

        {/* History Section */}
        {history.length > 0 && (
          <section className="mt-20 border-t border-gray-100 pt-16">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">최근 판독 타임라인</h3>
              <button className="text-sm text-blue-600 font-bold px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">이력 데이터 내보내기</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              {history.map((record) => (
                <div key={record.id} className="group bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer">
                  <div className="relative aspect-square mb-4 overflow-hidden rounded-2xl">
                    <img src={record.imageUrl} alt="이력" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black text-gray-800 shadow-sm">
                      #{record.id.toString().slice(-4)}
                    </div>
                  </div>
                  <div className="px-1">
                    <p className="text-sm font-black text-gray-900 truncate mb-1">{record.result.defectType}</p>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {new Date(record.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} • 분석완료
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
