
import React, { useState, useRef } from 'react';
import { NewCharacter } from '../types';
import { extractStatsFromMultipleImages } from '../services/geminiService';
import { CHARACTER_TYPES, RELEASE_TYPES } from '../constants.tsx';

interface BulkScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (characters: NewCharacter[]) => void;
}

const BulkScanModal: React.FC<BulkScanModalProps> = ({ isOpen, onClose, onImport }) => {
  const [selectedFiles, setSelectedFiles] = useState<{file: File, preview: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleStartScan = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);

    try {
      const base64Promises = selectedFiles.map(({ file }) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      const base64s = await Promise.all(base64Promises);
      // Gemini can handle batches well, but we'll limit to 5 at a time if there are many
      const batchSize = 5;
      const allResults: NewCharacter[] = [];

      for (let i = 0; i < base64s.length; i += batchSize) {
        const batch = base64s.slice(i, i + batchSize);
        const results = await extractStatsFromMultipleImages(batch);
        
        const formatted = results.map(r => ({
          record: '',
          name: r.name || 'Unknown',
          image: (r.name || '').replace(/\s+/g, ''),
          pimage: 'P' + (r.name || '').replace(/\s+/g, ''),
          type: CHARACTER_TYPES.find(t => r.type?.includes(t)) || CHARACTER_TYPES[0],
          release: RELEASE_TYPES.find(el => r.release?.includes(el)) || RELEASE_TYPES[0],
          str_init: r.str_init || 0,
          agi_init: r.agi_init || 0,
          sta_init: r.sta_init || 0,
          str_mul_in: r.str_mul_in || 0,
          agi_mul_in: r.agi_mul_in || 0,
          sta_mul_in: r.sta_mul_in || 0,
          bmv_str: r.bmv_str || 0,
          bmv_agi: r.bmv_agi || 0,
          bmv_sta: r.bmv_sta || 0,
          chinese: false,
          ...r
        }));
        
        allResults.push(...(formatted as NewCharacter[]));
      }

      onImport(allResults);
      onClose();
      setSelectedFiles([]);
    } catch (err) {
      alert("Batch scan failed. Please try fewer images or clearer screenshots.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-[40px] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Batch Vision Importer</h2>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-2">Convert multiple screenshots to data</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-10 overflow-y-auto flex-1">
          {selectedFiles.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 rounded-[32px] p-20 flex flex-col items-center justify-center gap-6 group cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
            >
              <div className="h-24 w-24 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-600 group-hover:text-indigo-400 group-hover:scale-110 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white mb-2 tracking-tight">Drop images or click to browse</p>
                <p className="text-sm text-slate-500">Supports JPG, PNG (Max 10 images recommended)</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {selectedFiles.map((f, i) => (
                <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-slate-700 group bg-slate-800 shadow-xl">
                  <img src={f.preview} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Preview" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-[10px] text-white font-bold truncate">{f.file.name}</p>
                  </div>
                  <button 
                    onClick={() => removeFile(i)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  {isProcessing && (
                    <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-[2px] flex items-center justify-center">
                       <div className="h-1 w-full bg-indigo-500 absolute top-0 animate-[scan_2s_infinite]"></div>
                       <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              ))}
              {!isProcessing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[3/4] border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-slate-600 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-10 border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl flex justify-between items-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {selectedFiles.length} Selected Screenshots
          </p>
          <div className="flex gap-4">
            <button 
              onClick={onClose} 
              disabled={isProcessing}
              className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleStartScan}
              disabled={isProcessing || selectedFiles.length === 0}
              className="px-12 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-black uppercase tracking-widest text-white shadow-2xl shadow-indigo-900/40 transition-all"
            >
              {isProcessing ? 'Analyzing Data Streams...' : 'Execute Batch Import'}
            </button>
          </div>
        </div>
      </div>
      <input type="file" ref={fileInputRef} multiple onChange={handleFileSelect} accept="image/*" className="hidden" />
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(300px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default BulkScanModal;
