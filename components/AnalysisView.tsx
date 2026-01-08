
import React from 'react';
import { QCAnalysisResult } from '../types';
import { ShieldCheck, AlertCircle, Lightbulb, ClipboardList, Loader2, Tag } from 'lucide-react';

interface AnalysisViewProps {
  image: string | null;
  result: QCAnalysisResult | null;
  isLoading: boolean;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ image, result, isLoading }) => {
  if (!image && !isLoading) return null;

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-6 bg-gray-900 flex items-center justify-center min-h-[400px]">
          {image && (
            <div className="relative w-full h-full max-h-[500px] flex items-center justify-center">
              <img 
                src={image} 
                alt="검사 대상" 
                className={`max-w-full max-h-full rounded shadow-2xl object-contain transition-opacity duration-500 ${isLoading ? 'opacity-50' : 'opacity-100'}`} 
              />
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
                  <p className="text-lg font-medium animate-pulse">패턴 분석 및 매뉴얼 대조 중...</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-blue-600" />
              품질 관리 판독 리포트
            </h3>
            <span className="text-xs font-mono text-gray-400">ID: QC-{Math.floor(Math.random() * 100000)}</span>
          </div>

          {result ? (
            <div className="space-y-6">
              <section>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <h4 className="font-bold text-gray-900">[결함 유형]</h4>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-black bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                    <Tag className="w-3 h-3" />
                    {result.category}
                  </span>
                </div>
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-red-900 font-semibold">{result.defectType}</p>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  <h4 className="font-bold text-gray-900">[유사 사례 근거]</h4>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-blue-900 text-sm leading-relaxed">{result.evidence}</p>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-gray-900">[권장 조치 사항]</h4>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl whitespace-pre-wrap">
                  <p className="text-amber-900 text-sm leading-relaxed">{result.recommendations}</p>
                </div>
              </section>

              <div className="pt-4 flex gap-3">
                <button className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">
                  리포트 PDF 저장
                </button>
                <button className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                  생산 라인 공유
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 py-20">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <p>분석 결과를 기다리는 중입니다...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
