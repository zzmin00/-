import React from 'react';
import { ProcessingResult } from '../types';
import { Download, Activity, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPreviewProps {
  result: ProcessingResult;
  onExport: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysisResult: string | null;
}

const DataPreview: React.FC<DataPreviewProps> = ({ result, onExport, onAnalyze, isAnalyzing, analysisResult }) => {
  // Downsample for chart performance if data is huge
  const chartData = result.data.filter((_, i) => i % Math.ceil(result.data.length / 200) === 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
            <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    {result.specimenLabel}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Source: {result.fileName}</p>
            </div>
            <div className="flex gap-3">
                 <button 
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    <Activity className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                    {isAnalyzing ? 'Analyzing with Gemini...' : 'AI Analysis'}
                </button>
                <button 
                    onClick={onExport}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export want.xlsx
                </button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-gray-100">
            <div className="p-6 text-center">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Rows</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{result.data.length}</p>
            </div>
            <div className="p-6 text-center">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Max Load (kgf)</p>
                <p className="mt-2 text-3xl font-semibold text-indigo-600">{result.maxLoad.toFixed(2)}</p>
            </div>
            <div className="p-6 text-center">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Max Strain (mm)</p>
                <p className="mt-2 text-3xl font-semibold text-purple-600">{result.maxStrain.toFixed(3)}</p>
            </div>
        </div>
        
        {/* Gemini Analysis Result */}
        {analysisResult && (
             <div className="p-6 bg-indigo-50 border-b border-gray-100">
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Gemini Insight
                </h3>
                <div className="prose prose-indigo prose-sm max-w-none text-gray-800 markdown-content">
                    {analysisResult.split('\n').map((line, i) => (
                        <p key={i} className={line.startsWith('-') || line.startsWith('1.') ? 'ml-4' : ''}>
                            {line}
                        </p>
                    ))}
                </div>
            </div>
        )}

        {/* Chart */}
        <div className="p-6 h-80">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Preview: Load vs Strain</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                        dataKey="strain" 
                        label={{ value: 'Strain (mm)', position: 'insideBottomRight', offset: -10 }} 
                        type="number"
                        domain={['auto', 'auto']}
                    />
                    <YAxis 
                        label={{ value: 'Load (kgf)', angle: -90, position: 'insideLeft' }} 
                        domain={['auto', 'auto']}
                    />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value: number) => value.toFixed(3)}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="load" 
                        stroke="#4f46e5" 
                        strokeWidth={2} 
                        dot={false} 
                        activeDot={{ r: 6 }} 
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Extracted Data (First 10 Rows)</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specimen Label</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compression Strain (mm)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compression Load (kgf)</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {result.data.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.specimenLabel}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.strain.toFixed(4)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.load.toFixed(3)}</td>
                        </tr>
                    ))}
                    <tr>
                        <td colSpan={3} className="px-6 py-3 text-center text-xs text-gray-400 italic bg-gray-50">
                            ... {result.data.length - 10} more rows ...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default DataPreview;
