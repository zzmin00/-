import React, { useState } from 'react';
import { extractSourceData, mergeDataIntoTarget } from './services/excelProcessor';
import FileUpload from './components/FileUpload';
import { AppState } from './types';
import { Layers, ArrowRight, Download, RefreshCw, AlertCircle, FilePlus, Loader2, Sparkles, FileText, Database } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleMerge = async () => {
    if (sourceFiles.length === 0 || !targetFile) return;

    try {
      setAppState(AppState.PROCESSING);
      setErrorMsg(null);

      // 1. Extract Data from ALL source files in parallel
      const sortedFiles = [...sourceFiles].sort((a, b) => a.name.localeCompare(b.name));
      
      const allExtractedDataBatches = await Promise.all(
        sortedFiles.map(file => extractSourceData(file))
      );
      
      const allExtractedData = allExtractedDataBatches.flat();

      if (allExtractedData.length === 0) {
        throw new Error("No valid samples found in the source files. Please check column format.");
      }
      
      // 2. Merge all extracted data into the target file
      const resultBlob = await mergeDataIntoTarget(targetFile, allExtractedData);
      
      // 3. Prepare Download
      const url = URL.createObjectURL(resultBlob);
      setDownloadUrl(url);
      setAppState(AppState.SUCCESS);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during processing");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setSourceFiles([]);
    setTargetFile(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setErrorMsg(null);
  };

  const getDownloadFileName = () => {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `면압 요약_${yy}${mm}${dd}.xlsx`;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-800 font-sans selection:bg-pink-100 selection:text-pink-600">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-pink-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-pink-500 to-rose-400 text-white p-2 rounded-xl shadow-md">
                <Layers className="h-6 w-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-800">
                Data<span className="text-pink-500">Merger</span>
              </span>
            </div>
            <div>
                 <button 
                  onClick={() => window.location.reload()}
                  className="text-gray-400 hover:text-pink-500 p-2 transition-colors rounded-full hover:bg-pink-50"
                  title="Reset Application"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-sm font-medium mb-2">
            <Sparkles className="w-4 h-4 mr-2 fill-current" />
            Auto-Extraction Ready
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Merge Lab Data <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">Effortlessly</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500 leading-relaxed">
            Upload your raw instrument files and the master summary file. We'll automatically extract, align, and append the data for you.
          </p>
        </div>

        {/* Error Display */}
        {appState === AppState.ERROR && (
          <div className="mb-8 mx-auto max-w-2xl rounded-2xl bg-red-50 p-6 border border-red-100 animate-fade-in shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-base font-semibold text-red-800">Something went wrong</h3>
                <div className="mt-2 text-sm text-red-700 leading-relaxed">{errorMsg}</div>
                <button 
                    onClick={() => setAppState(AppState.IDLE)} 
                    className="mt-4 text-sm font-semibold text-red-600 hover:text-red-800 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                >
                    Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success / Download Section */}
        {appState === AppState.SUCCESS && downloadUrl ? (
             <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-10 text-center animate-fade-in max-w-2xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-rose-500"></div>
                
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-50 mb-6 ring-8 ring-green-50/50">
                    <Download className="h-10 w-10 text-green-500" />
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-3">All Done!</h2>
                <p className="text-gray-500 mb-8 text-lg">
                    Successfully merged <strong className="text-gray-800">{sourceFiles.length}</strong> source files into your summary report.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <a 
                        href={downloadUrl} 
                        download={getDownloadFileName()}
                        className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-200 transform hover:-translate-y-1 transition-all duration-200"
                    >
                        <Download className="w-6 h-6 mr-2" />
                        Download File
                    </a>
                    <button 
                        onClick={handleReset}
                        className="inline-flex items-center justify-center px-8 py-4 border border-gray-200 text-lg font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Start Over
                    </button>
                </div>
             </div>
        ) : (
            /* Upload Section */
            <div className="max-w-5xl mx-auto">
                <div className="relative flex flex-col md:flex-row gap-8 items-stretch justify-center">
                    
                    {/* Step 1 Card */}
                    <div className="flex-1 bg-white rounded-3xl shadow-lg border border-gray-100 p-1 transition-all duration-300 hover:shadow-xl hover:border-pink-100">
                         <div className="p-6 pb-2">
                             <div className="flex items-center gap-3 mb-4">
                                <div className="bg-pink-100 text-pink-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">1</div>
                                <h3 className="text-lg font-bold text-gray-800">Raw Data</h3>
                             </div>
                             <p className="text-sm text-gray-500 mb-6 pl-13">
                                Upload the test files (Excel) containing your raw measurement data.
                             </p>
                         </div>
                         <div className="px-6 pb-8">
                             <FileUpload 
                                label="Source Files" 
                                icon={<FileText className="w-8 h-8 text-pink-400" />}
                                files={sourceFiles} 
                                onFilesSelect={setSourceFiles} 
                                onClear={() => setSourceFiles([])}
                                disabled={appState === AppState.PROCESSING}
                                multiple={true}
                            />
                         </div>
                    </div>

                    {/* Desktop Arrow Connector */}
                    <div className="hidden md:flex flex-col justify-center items-center text-gray-300 z-0">
                        <ArrowRight className="w-10 h-10 text-pink-200" />
                    </div>

                    {/* Step 2 Card */}
                    <div className="flex-1 bg-white rounded-3xl shadow-lg border border-gray-100 p-1 transition-all duration-300 hover:shadow-xl hover:border-pink-100">
                        <div className="p-6 pb-2">
                             <div className="flex items-center gap-3 mb-4">
                                <div className="bg-rose-100 text-rose-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">2</div>
                                <h3 className="text-lg font-bold text-gray-800">Master Summary</h3>
                             </div>
                             <p className="text-sm text-gray-500 mb-6 pl-13">
                                Upload the summary Excel file where you want the data to be added.
                             </p>
                         </div>
                         <div className="px-6 pb-8">
                             <FileUpload 
                                label="Target File" 
                                icon={<Database className="w-8 h-8 text-rose-400" />}
                                files={targetFile ? [targetFile] : []} 
                                onFilesSelect={(files) => setTargetFile(files[0])} 
                                onClear={() => setTargetFile(null)}
                                disabled={appState === AppState.PROCESSING}
                                multiple={false}
                            />
                         </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="mt-12 text-center">
                    <button 
                        onClick={handleMerge}
                        disabled={sourceFiles.length === 0 || !targetFile || appState === AppState.PROCESSING}
                        className={`
                            group relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold rounded-2xl text-white shadow-xl transition-all duration-300
                            ${(sourceFiles.length === 0 || !targetFile) 
                                ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                                : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 hover:scale-105 hover:shadow-2xl shadow-pink-200'}
                            ${appState === AppState.PROCESSING ? 'cursor-wait opacity-90' : ''}
                        `}
                    >
                        {appState === AppState.PROCESSING ? (
                             <>
                                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                Processing Data...
                             </>
                        ) : (
                             <>
                                <FilePlus className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                                Run Merge Pipeline
                                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                             </>
                        )}
                    </button>
                    
                    {/* Status Text */}
                    <div className="mt-4 h-6">
                        {sourceFiles.length > 0 && targetFile && appState === AppState.IDLE && (
                            <p className="text-pink-600 font-medium animate-fade-in text-sm">
                                Ready to process {sourceFiles.length} files!
                            </p>
                        )}
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
