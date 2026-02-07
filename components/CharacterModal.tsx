
import React, { useState, useEffect, useRef } from 'react';
import { Character, NewCharacter } from '../types';
import { CHARACTER_TYPES, RELEASE_TYPES } from '../constants.tsx';
import { generateCharacterStats, extractStatsFromImage } from '../services/geminiService';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (character: Character | NewCharacter) => void;
  editingCharacter?: Character | null;
}

const CharacterModal: React.FC<CharacterModalProps> = ({ isOpen, onClose, onSave, editingCharacter }) => {
  const initialFormState: NewCharacter = {
    record: '',
    name: '',
    image: '',
    pimage: '',
    type: CHARACTER_TYPES[0],
    release: RELEASE_TYPES[0],
    str_init: 0,
    agi_init: 0,
    sta_init: 0,
    str_mul_in: 0,
    agi_mul_in: 0,
    sta_mul_in: 0,
    bmv_str: 0,
    bmv_agi: 0,
    bmv_sta: 0,
    chinese: false
  };

  const [formData, setFormData] = useState<NewCharacter>(initialFormState);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCharacter) {
      setFormData(editingCharacter);
    } else {
      setFormData(initialFormState);
    }
  }, [editingCharacter, isOpen]);

  const handleAIAction = async () => {
    if (!formData.name) {
      alert("Please provide a name first for AI generation.");
      return;
    }
    setIsGenerating(true);
    try {
      const suggestedStats = await generateCharacterStats(formData.name, prompt);
      setFormData(prev => ({ ...prev, ...suggestedStats }));
    } catch (err) {
      alert("Failed to generate stats. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setIsScanning(true);
      try {
        const extracted = await extractStatsFromImage(base64);
        setFormData(prev => ({
          ...prev,
          ...extracted,
          // Map extracted release to our standard types if possible
          release: RELEASE_TYPES.find(r => extracted.release?.includes(r)) || prev.release,
          type: CHARACTER_TYPES.find(t => extracted.type?.includes(t)) || prev.type,
        }));
      } catch (err) {
        alert("Image scan failed. Ensure the text is clear.");
      } finally {
        setIsScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNumChange = (field: keyof NewCharacter, value: string) => {
    const parsed = parseFloat(value);
    setFormData(prev => ({
      ...prev,
      [field]: isNaN(parsed) ? 0 : parsed
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              {editingCharacter ? `Update Profile: ${editingCharacter.name}` : 'New Entity Registration'}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manual Entry or AI Scan</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 flex flex-col lg:flex-row gap-10">
          {/* Left Column: Visual Scanning & AI */}
          <div className="w-full lg:w-1/3 space-y-8">
            <div className="bg-indigo-600/10 border border-indigo-500/30 p-6 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
              <h3 className="text-indigo-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-lg">📸</span> Visual Scanner
              </h3>
              <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                Upload a screenshot of the character card to automatically extract all stats and multipliers.
              </p>
              
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="w-full bg-slate-950 border border-indigo-500/30 hover:border-indigo-400 hover:bg-slate-900 py-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all relative group/btn"
              >
                {isScanning ? (
                  <>
                    <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-indigo-400">Analyzing Pixels...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-bold text-slate-300">Select Character Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {/* Right Column: Form Fields */}
          <div className="flex-1 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 pb-2">Identification</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Character Identity</label>
                    <input
                      type="text"
                      value={formData.name}
                      placeholder="e.g. Ggio Vega"
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tier Type</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs outline-none"
                      >
                        {CHARACTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Release</label>
                      <select
                        value={formData.release}
                        onChange={e => setFormData({ ...formData, release: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs outline-none"
                      >
                        {RELEASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50 group cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, chinese: !prev.chinese }))}>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${formData.chinese ? 'bg-red-500/20 text-red-500' : 'bg-slate-700 text-slate-500'}`}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chinese Region Variant</div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Enable for regional stat adjustments</div>
                    </div>
                    <div className={`h-6 w-11 rounded-full p-1 transition-all ${formData.chinese ? 'bg-red-600' : 'bg-slate-700'}`}>
                      <div className={`h-4 w-4 rounded-full bg-white transition-all transform ${formData.chinese ? 'translate-x-5' : ''}`}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 pb-2">Primary Coefficients</h3>
                <div className="grid grid-cols-1 gap-5">
                   {['str', 'agi', 'sta'].map((stat) => (
                    <div key={stat} className="flex items-center gap-4">
                      <div className="w-16">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat}</span>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-3">
                         <div>
                           <label className="block text-[8px] text-slate-600 font-bold uppercase mb-1">Base Value</label>
                           <input 
                             type="number" 
                             value={(formData as any)[`${stat}_init`]} 
                             onChange={e => handleNumChange(`${stat}_init` as any, e.target.value)} 
                             className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none" 
                           />
                         </div>
                         <div>
                           <label className="block text-[8px] text-slate-600 font-bold uppercase mb-1">Gain Multi</label>
                           <input 
                             type="number" 
                             step="0.001" 
                             value={(formData as any)[`${stat}_mul_in`]} 
                             onChange={e => handleNumChange(`${stat}_mul_in` as any, e.target.value)} 
                             className="w-full bg-slate-950 border border-indigo-500/30 rounded-lg px-3 py-2 text-indigo-400 text-xs outline-none" 
                           />
                         </div>
                      </div>
                    </div>
                   ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/20 p-8 rounded-3xl border border-slate-800">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Internal Base Mechanics (BMV)</h3>
               <div className="grid grid-cols-3 gap-8">
                  {['str', 'agi', 'sta'].map((stat) => (
                    <div key={`bmv-${stat}`}>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{stat} Threshold</label>
                      <input 
                        type="number" 
                        value={(formData as any)[`bmv_${stat}`]} 
                        onChange={e => handleNumChange(`bmv_${stat}` as any, e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-indigo-500 outline-none" 
                      />
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl flex justify-end gap-4">
          <button onClick={onClose} className="px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Discard Changes</button>
          <button onClick={() => onSave(formData)} className="px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-900/30 transition-all active:scale-95">
            {editingCharacter ? 'Commit Profile Update' : 'Initialize Database Entry'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterModal;
