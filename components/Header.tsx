
import React from 'react';

const Header: React.FC = () => {
  return (
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
};

export default Header;
