import React, { useCallback } from 'react';
import { Upload, CheckCircle, X, Files, FileSpreadsheet } from 'lucide-react';

interface FileUploadProps {
  label: string;
  files: File[];
  onFilesSelect: (files: File[]) => void;
  onClear: () => void;
  disabled: boolean;
  multiple?: boolean;
  accept?: string;
  icon?: React.ReactNode;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  files, 
  onFilesSelect, 
  onClear,
  disabled,
  multiple = false,
  accept = ".xlsx,.xls",
  icon
}) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter((f: File) => f.name.match(/\.(xlsx|xls|csv)$/i));
      
      if (droppedFiles.length === 0) {
        alert("Please upload Excel files.");
        return;
      }

      if (!multiple && droppedFiles.length > 1) {
         onFilesSelect([droppedFiles[0]]);
      } else {
         onFilesSelect(droppedFiles);
      }
    }
  }, [onFilesSelect, disabled, multiple]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelect(selectedFiles);
    }
  };

  // State: File Selected
  if (files.length > 0) {
    return (
      <div className="relative group border-2 border-pink-200 bg-pink-50/50 rounded-2xl p-6 flex flex-col items-center justify-center transition-all min-h-[220px]">
         <button 
           onClick={onClear} 
           className="absolute top-3 right-3 p-2 text-pink-300 hover:text-red-500 hover:bg-white rounded-full transition-all"
           disabled={disabled}
           title="Clear files"
         >
           <X className="w-5 h-5" />
         </button>
         
         {multiple && files.length > 1 ? (
             <>
                <div className="bg-white p-4 rounded-full mb-4 shadow-sm relative ring-4 ring-pink-100">
                    <Files className="w-8 h-8 text-pink-500" />
                    <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                        {files.length}
                    </span>
                </div>
                <p className="text-lg font-bold text-gray-800 text-center mb-1">
                    {files.length} Files Added
                </p>
                <div className="w-full mt-3 pr-2 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent">
                    <ul className="text-sm text-gray-600 text-center space-y-2">
                        {files.map((f, i) => (
                            <li key={i} className="truncate bg-white/80 px-3 py-1 rounded-md text-xs border border-pink-100 shadow-sm" title={f.name}>
                                {f.name}
                            </li>
                        ))}
                    </ul>
                </div>
             </>
         ) : (
             <>
                <div className="bg-white p-4 rounded-full mb-4 shadow-sm ring-4 ring-pink-100">
                   <CheckCircle className="w-10 h-10 text-pink-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800 break-all text-center px-4 max-w-full leading-tight">
                    {files[0].name}
                </p>
                <p className="text-xs text-pink-400 mt-2 font-medium uppercase tracking-wide">Ready to Merge</p>
             </>
         )}
      </div>
    );
  }

  // State: Empty / Waiting
  return (
    <div 
      className={`
        border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] group
        ${disabled 
            ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' 
            : 'border-pink-200 hover:border-pink-400 hover:bg-pink-50/30 cursor-pointer hover:shadow-inner'}
      `}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input 
        type="file" 
        id={`file-upload-${label}`} 
        className="hidden" 
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        multiple={multiple}
      />
      <label htmlFor={`file-upload-${label}`} className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
        <div className="bg-pink-50 group-hover:bg-white group-hover:scale-110 transition-all duration-300 p-4 rounded-full mb-4 shadow-sm ring-1 ring-pink-100/50">
          {icon ? icon : (multiple ? <Files className="w-8 h-8 text-pink-400" /> : <FileSpreadsheet className="w-8 h-8 text-pink-400" />)}
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors">
          Click to Upload
        </h3>
        <p className="text-sm text-gray-400 mb-4 px-4 leading-relaxed">
          {multiple ? "or drag multiple files here" : "or drag your summary file here"}
        </p>
        <span className="inline-flex items-center px-4 py-2 bg-white border border-pink-200 text-xs font-bold rounded-full text-pink-600 shadow-sm group-hover:bg-pink-600 group-hover:text-white group-hover:border-transparent transition-all">
          <Upload className="w-3 h-3 mr-2" />
          Browse Computer
        </span>
      </label>
    </div>
  );
};

export default FileUpload;
