
import React, { useState } from 'react';
import { HardDrive, Folder, FileText, CheckCircle, Search, ExternalLink, Loader2, ChevronRight, Check } from 'lucide-react';
import { ReferenceFile } from '../types';

interface DriveSetupModalProps {
  onComplete: (sources: ReferenceFile[]) => void;
  onClose: () => void;
}

const MOCK_DRIVE_CONTENTS: ReferenceFile[] = [
  { id: 'f1', name: '2024_생산라인_표준_매뉴얼', type: 'folder', lastModified: '2024-12-01' },
  { id: 'f2', name: '품질관리_결함_데이터베이스', type: 'folder', lastModified: '2025-01-15' },
  { id: 'ref1', name: 'A구역_용접_불량_판독기준.pdf', type: 'pdf', size: '2.4MB', lastModified: '2025-02-10' },
  { id: 'ref2', name: '사출성형_기포_발생_사례.txt', type: 'text', size: '15KB', lastModified: '2024-11-20' },
  { id: 'ref3', name: '스크래치_허용_범위_이미지.img', type: 'image', size: '4.1MB', lastModified: '2025-01-05' },
  { id: 'ref4', name: 'B라인_조립_체크리스트.pdf', type: 'pdf', size: '1.2MB', lastModified: '2025-02-28' },
];

const DriveSetupModal: React.FC<DriveSetupModalProps> = ({ onComplete, onClose }) => {
  const [step, setStep] = useState<'auth' | 'designate'>('auth');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAuth = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setStep('designate');
      setIsProcessing(false);
    }, 1200);
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleConfirmDesignation = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const selectedSources = MOCK_DRIVE_CONTENTS.filter(item => selectedIds.has(item.id));
      onComplete(selectedSources);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-none">지식 베이스 지정</h2>
              <p className="text-[11px] text-blue-600 font-medium mt-1">Google Drive Archive</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
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
                <p className="text-gray-500 text-sm leading-relaxed">
                  노트북LM과 같이 분석에 필요한 사내 품질 매뉴얼, 결함 사례집 폴더 및 파일을 선택하여 AI의 판독 근거로 지정합니다.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAuth}
                  disabled={isProcessing}
                  className="w-full max-w-sm mx-auto bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <ExternalLink className="w-5 h-5" />
                      구글 드라이브 접근 권한 허용
                    </>
                  )}
                </button>
                <p className="text-[11px] text-gray-400">Google Cloud Platform 보안 가이드라인을 준수합니다.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">자료 선택</h3>
                  <p className="text-xs text-gray-500">분석 시 근거로 사용할 파일이나 폴더를 체크하세요.</p>
                </div>
                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                  {selectedIds.size}개 선택됨
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="파일명 또는 폴더명 검색..." 
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
              
              <div className="max-h-[320px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {MOCK_DRIVE_CONTENTS.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleSelection(item.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                      selectedIds.has(item.id) 
                        ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' 
                        : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.type === 'folder' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.type === 'folder' ? <Folder className="w-5 h-5 fill-current" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-bold ${selectedIds.has(item.id) ? 'text-blue-700' : 'text-gray-800'}`}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {item.type === 'folder' ? '폴더' : item.size} • 수정일: {item.lastModified}
                        </p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedIds.has(item.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 group-hover:border-blue-300'
                    }`}>
                      {selectedIds.has(item.id) && <Check className="w-3 h-3 stroke-[4]" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setStep('auth')}
                  className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={handleConfirmDesignation}
                  disabled={isProcessing || selectedIds.size === 0}
                  className="flex-[2] bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      지식 베이스로 추가하기
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriveSetupModal;
