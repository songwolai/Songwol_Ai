
import React, { useRef } from 'react';
// Added CheckCircle to imports to fix "Cannot find name 'CheckCircle'" error
import { Camera, Upload, HardDrive, ShieldCheck, RefreshCcw, Folder, FileText, Settings2, CheckCircle } from 'lucide-react';
import { ReferenceFile, DriveConnection } from '../types';

interface UploadSectionProps {
  onImageSelect: (base64: string) => void;
  driveInfo: DriveConnection;
  onOpenSetup: () => void;
  isLoading: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ 
  onImageSelect, 
  driveInfo,
  onOpenSetup,
  isLoading 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative group">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <Camera className="w-5 h-5" />
              </div>
              검사 이미지 판독
            </h2>
            <span className="text-[10px] font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded-lg">Real-time Analysis</span>
          </div>
          
          <div 
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-14 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
              isLoading ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 group-hover:shadow-inner'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
              accept="image/*"
              disabled={isLoading}
            />
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-200 group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-900 font-bold text-lg mb-1">여기를 클릭하여 이미지 업로드</p>
            <p className="text-gray-400 text-sm">또는 파일을 이 창으로 드래그 하세요</p>
            <div className="mt-8 flex gap-4">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> PNG, JPG
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Auto-Sync
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <HardDrive className="w-5 h-5" />
              </div>
              지식 베이스
            </h2>
            <button 
              onClick={onOpenSetup}
              className="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl transition-all"
              title="설정 변경"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>

          {!driveInfo.isConnected ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-indigo-100 rounded-2xl bg-indigo-50/20">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-300 mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-indigo-900 mb-2">연동된 자료가 없습니다</p>
              <p className="text-xs text-indigo-600/70 mb-6 leading-relaxed">AI가 판독 근거로 사용할<br/>드라이브 자료를 지정해 주세요.</p>
              <button 
                onClick={onOpenSetup}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                자료 지정하기
              </button>
            </div>
          ) : (
            <div className="space-y-5 flex-grow overflow-hidden flex flex-col">
              <div className="flex items-center justify-between bg-green-50 border border-green-100 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-green-800 uppercase tracking-wider leading-none">Status</p>
                    <p className="text-[10px] text-green-600 mt-1 font-bold">동기화 활성화됨</p>
                  </div>
                </div>
                <div className="text-[10px] text-green-700 font-bold bg-white/50 px-2 py-1 rounded">
                  {driveInfo.designatedSources.length} Sources
                </div>
              </div>
              
              <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Designated Archive</p>
                {driveInfo.designatedSources.map((source) => (
                  <div key={source.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-200 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      source.type === 'folder' ? 'bg-amber-100 text-amber-600' : 'bg-white text-gray-400 shadow-sm'
                    }`}>
                      {source.type === 'folder' ? <Folder className="w-4 h-4 fill-current" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-[11px] font-bold text-gray-800 truncate">{source.name}</p>
                      <p className="text-[9px] text-gray-400">{source.type === 'folder' ? 'Designated Folder' : source.size}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-auto">
                <button 
                  onClick={onOpenSetup}
                  className="w-full flex items-center justify-center gap-2 py-3 text-[11px] font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  지식 베이스 업데이트
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadSection;
