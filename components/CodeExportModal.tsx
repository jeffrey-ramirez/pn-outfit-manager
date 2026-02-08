
import React from 'react';
import { Character } from '../types';
import CodeBlock from './CodeBlock';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  title?: string;
}

const CodeExportModal: React.FC<CodeExportModalProps> = ({ isOpen, onClose, characters, title }) => {
  if (!isOpen || characters.length === 0) return null;

  const generateCSharpCode = (chars: Character[]) => {
    // Format multiplier helper: toFixed(2) but remove trailing zero if unnecessary
    const formatMul = (val: number) => parseFloat(val.toFixed(2));
    const staticEntry = `new Outfit
{
    id = 0,
    record = new int[3] { 1, 2, 1 },
    name = "Ggio Vega",
    image = Resources.GgioVega,
    pimage = Resources.PGgioVega,
    type = "Grey",
    release = "Wind",
    str_init = 13,
    agi_init = 22,
    sta_init = 13,
    str_mul_init = 0.65,
    agi_mul_init = 1.1,
    sta_mul_init = 0.65,
    bmv_str = 17,
    bmv_agi = 10,
    bmv_sta = 14
},`;

    const generatedEntries = chars.map((char, index) => {
      const sanitizedName = char.name.replace(/\s+/g, '');
      const record = char.record || '0/0/0';
      
      // Since Ggio Vega takes ID 0, dynamic entries start from 1
      const currentId = index + 1;
      
      return `new Outfit
{
    id = ${currentId},
    record = new int[3] { ${record.split('/').map(n => n.trim()).join(', ')} },
    name = "${char.name}",
    image = Resources.${sanitizedName},
    pimage = Resources.P${sanitizedName},
    type = "${char.type}",
    release = "${char.release || 'None'}",
    str_init = ${char.str_init || 10},
    agi_init = ${char.agi_init || 10},
    sta_init = ${char.sta_init || 10},
    str_mul_init = ${formatMul(char.str_mul_in)},
    agi_mul_init = ${formatMul(char.agi_mul_in)},
    sta_mul_init = ${formatMul(char.sta_mul_in)},
    bmv_str = ${char.bmv_str || 15},
    bmv_agi = ${char.bmv_agi || 15},
    bmv_sta = ${char.bmv_sta || 15}
},`;
    }).join('\n');

    return staticEntry + '\n' + generatedEntries;
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Fixed Modal Header */}
        <div className="px-10 py-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-5">
            <div className="h-12 w-12 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                {title || (characters.length > 1 ? 'Archive Engine Export' : 'C# Entry Manifest')}
              </h2>
              <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1">
                {characters.length === 1 
                  ? `Compiling profile for ${characters[0].name}` 
                  : `Batch processing ${characters.length} character entities`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#080808]">
          <div className="p-10">
            <CodeBlock code={generateCSharpCode(characters)} />
            
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
               <div className="h-12 w-12 flex-shrink-0 bg-indigo-500/10 rounded-full flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
               <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Integration Note</p>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    The sequence above is ready for immediate inclusion in your C# <code>List&lt;Outfit&gt;</code>. 
                    IDs have been reset to a zero-indexed sequence starting with Ggio Vega at index 0.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeExportModal;
