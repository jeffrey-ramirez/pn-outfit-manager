
import React, { useState, useMemo, useRef } from 'react';
import { Character, NewCharacter } from './types';
import { INITIAL_DATA, CHARACTER_TYPES } from './constants.tsx';
import CharacterModal from './components/CharacterModal';
import BulkScanModal from './components/BulkScanModal';
import StatsRadar from './components/StatsRadar';
import CharacterCard from './components/CharacterCard';
import { exportToCSV, parseCSV } from './utils/csv';

type SortDirection = 'asc' | 'desc' | null;

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>(INITIAL_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassification, setFilterClassification] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkScanOpen, setIsBulkScanOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [typeSortDirection, setTypeSortDirection] = useState<SortDirection>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statsByClassification = useMemo(() => {
    const counts: Record<string, number> = {};
    CHARACTER_TYPES.forEach(type => {
      counts[type] = characters.filter(c => c.type === type).length;
    });
    return counts;
  }, [characters]);

  const processedCharacters = useMemo(() => {
    let filtered = characters.filter(char => {
      const matchesSearch = 
        (char.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (char.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (char.release || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesClassification = filterClassification ? char.type === filterClassification : true;
      
      return matchesSearch && matchesClassification;
    });

    if (typeSortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const indexA = CHARACTER_TYPES.indexOf(a.type);
        const indexB = CHARACTER_TYPES.indexOf(b.type);
        if (typeSortDirection === 'asc') {
          return indexA - indexB;
        } else {
          return indexB - indexA;
        }
      });
    }

    return filtered;
  }, [characters, searchTerm, filterClassification, typeSortDirection]);

  const handleSave = (char: Character | NewCharacter) => {
    if ('id' in char) {
      setCharacters(prev => prev.map(c => c.id === char.id ? char : c));
    } else {
      const newChar: Character = {
        ...char,
        id: Math.random().toString(36).substr(2, 9)
      };
      setCharacters(prev => [...prev, newChar]);
    }
    setIsModalOpen(false);
    setEditingCharacter(null);
  };

  const handleBulkImport = (newChars: NewCharacter[]) => {
    const formatted = newChars.map(char => ({
      ...char,
      id: Math.random().toString(36).substr(2, 9)
    }));
    setCharacters(prev => [...prev, ...formatted]);
    alert(`Imported ${newChars.length} characters successfully!`);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this character?")) {
      setCharacters(prev => prev.filter(c => c.id !== id));
      if (selectedCharacter?.id === id) setSelectedCharacter(null);
    }
  };

  const handleClearAll = () => {
    if (confirm("DANGER: This will delete ALL characters in the current view. Proceed?")) {
      setCharacters([]);
      setSelectedCharacter(null);
    }
  };

  const handleEdit = (char: Character) => {
    setEditingCharacter(char);
    setIsModalOpen(true);
  };

  const toggleTypeSort = () => {
    setTypeSortDirection(prev => {
      if (prev === null) return 'asc';
      if (prev === 'asc') return 'desc';
      return null;
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const importedData = parseCSV(text);
        if (importedData.length > 0) {
          const formattedImport = importedData.map(item => ({
            ...item,
            id: Math.random().toString(36).substr(2, 9)
          }));
          setCharacters(prev => [...prev, ...formattedImport]);
          alert(`Success! Imported ${importedData.length} records.`);
        } else {
          alert("Import failed: No valid records found.");
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getClassificationColor = (type: string) => {
    const purpleTier = ['Shippuden', 'Bankai', 'Resurrected', 'Espadas'];
    const redTier = ['Lieutenants', 'Akatsuki', 'Heroes of the Villages', 'Captains', 'Kages', 'Yonkos & Mugiwaras'];
    const pinkTier = ['S-Rank', 'Legends', 'Limited Legends'];
    const goldTier = ['Mythics'];
    const orangeTier = ['Orange'];
    const blueTier = ['Blue'];

    if (goldTier.includes(type)) return 'from-yellow-400 to-yellow-600 shadow-yellow-500/20';
    if (purpleTier.includes(type)) return 'from-purple-500 to-purple-700 shadow-purple-500/20';
    if (redTier.includes(type)) return 'from-red-500 to-red-700 shadow-red-500/20';
    if (pinkTier.includes(type)) return 'from-pink-400 to-pink-600 shadow-pink-500/20';
    if (orangeTier.includes(type)) return 'from-orange-400 to-orange-600 shadow-orange-500/20';
    if (blueTier.includes(type)) return 'from-blue-400 to-blue-600 shadow-blue-500/20';
    
    return 'from-slate-600 to-slate-700 shadow-slate-500/10';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />

      <header className="bg-black border-b border-slate-900 px-8 py-5 flex flex-wrap gap-6 justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">Vault Engine</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em]">{characters.length} Registered Entities</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search Archives..."
              className="bg-slate-900 border border-slate-800 rounded px-5 py-2.5 pl-12 text-sm text-white focus:ring-1 focus:ring-indigo-500 w-80 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-4 top-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setIsBulkScanOpen(true)} className="px-4 py-2 border border-indigo-500/30 bg-indigo-500/5 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all">Batch OCR</button>
            <button onClick={handleImportClick} className="px-4 py-2 border border-slate-800 text-[10px] font-bold text-slate-400 hover:bg-slate-900 transition-all uppercase">Import</button>
            <button onClick={() => exportToCSV(characters)} className="px-4 py-2 border border-slate-800 text-[10px] font-bold text-slate-400 hover:bg-slate-900 transition-all uppercase">Export</button>
            <button onClick={handleClearAll} className="p-2 border border-red-900/30 text-red-500 hover:bg-red-900/20 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
          </div>

          <button 
            onClick={() => { setEditingCharacter(null); setIsModalOpen(true); }}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-indigo-900/20"
          >
            New Record
          </button>
        </div>
      </header>

      <div className="px-8 py-6 overflow-x-auto bg-[#0a0a0a] border-b border-slate-900">
        <div className="flex gap-3 pb-2 no-scrollbar">
          <div 
            onClick={() => setFilterClassification(null)}
            className={`min-w-[120px] flex-shrink-0 cursor-pointer p-3 border transition-all ${!filterClassification ? 'bg-indigo-600 border-indigo-400' : 'bg-black border-slate-800 hover:border-slate-700'}`}
          >
            <div className={`text-[9px] font-black uppercase tracking-widest ${!filterClassification ? 'text-indigo-100' : 'text-slate-500'}`}>Full Roster</div>
            <div className={`text-xl font-black mt-1 ${!filterClassification ? 'text-white' : 'text-slate-300'}`}>{characters.length}</div>
          </div>
          
          {CHARACTER_TYPES.map(type => (
            <div 
              key={type}
              onClick={() => setFilterClassification(type === filterClassification ? null : type)}
              className={`min-w-[130px] flex-shrink-0 cursor-pointer p-3 border transition-all ${filterClassification === type ? `bg-gradient-to-br ${getClassificationColor(type)} text-white border-white/20 shadow-lg` : 'bg-black border-slate-800 hover:border-slate-700'}`}
            >
              <div className={`text-[9px] font-black uppercase tracking-widest ${filterClassification === type ? 'text-white/80' : 'text-slate-500'}`}>{type}</div>
              <div className="flex items-center justify-between mt-1">
                <div className={`text-xl font-black ${filterClassification === type ? 'text-white' : 'text-slate-300'}`}>{statsByClassification[type] || 0}</div>
                {statsByClassification[type] > 0 && <div className={`h-1.5 w-1.5 rounded-full ${filterClassification === type ? 'bg-white' : 'bg-indigo-500 animate-pulse'}`}></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto p-8 bg-[#050505]">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
              <span className="h-4 w-1 bg-indigo-500"></span> 
              Database Result Set {filterClassification ? `(${filterClassification})` : '(Full)'}
            </h2>
            <div 
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-white"
              onClick={toggleTypeSort}
            >
              Sort Order: <span className="text-indigo-500">{typeSortDirection === 'asc' ? 'TIER ASC' : typeSortDirection === 'desc' ? 'TIER DESC' : 'DEFAULT'}</span>
            </div>
          </div>

          {processedCharacters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {processedCharacters.map(char => (
                <CharacterCard 
                  key={char.id}
                  character={char}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onClick={setSelectedCharacter}
                  isSelected={selectedCharacter?.id === char.id}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
              <div className="text-4xl mb-4">📂</div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Archive Sector Empty</p>
            </div>
          )}
        </div>

        <aside className={`w-[450px] bg-black border-l border-slate-900 p-8 flex flex-col transition-all duration-500 ease-in-out transform shadow-2xl ${selectedCharacter ? 'translate-x-0' : 'translate-x-full absolute right-0'}`}>
          {selectedCharacter && (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-indigo-500 animate-pulse"></div>
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Neural Link Analysis</h3>
                </div>
                <button onClick={() => setSelectedCharacter(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="flex-1 space-y-10 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex justify-center">
                   <CharacterCard 
                    character={selectedCharacter} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete} 
                    onClick={() => {}} 
                    isSelected={false} 
                   />
                </div>
                
                <div className="bg-[#0a0a0a] border border-slate-800 p-6 rounded-lg">
                   <StatsRadar character={selectedCharacter} />
                </div>
                
                <div className="space-y-4">
                   <div className="p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-lg">
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Growth Vectoring</div>
                      <div className="flex items-end justify-between">
                         <div className="text-2xl font-black text-white">{(selectedCharacter.str_mul_in + selectedCharacter.agi_mul_in + selectedCharacter.sta_mul_in).toFixed(2)}x</div>
                         <div className="text-[9px] text-slate-500 font-bold">Aggregate Coefficient</div>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-lg">
                         <div className="text-[9px] text-slate-500 font-black uppercase mb-1">Region Mask</div>
                         <div className="text-white text-xs font-bold">{selectedCharacter.chinese ? 'CHINESE' : 'GLOBAL'}</div>
                      </div>
                      <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-lg">
                         <div className="text-[9px] text-slate-500 font-black uppercase mb-1">Category</div>
                         <div className="text-white text-xs font-bold uppercase">{selectedCharacter.type}</div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </main>

      <CharacterModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCharacter(null); }} onSave={handleSave} editingCharacter={editingCharacter} />
      <BulkScanModal isOpen={isBulkScanOpen} onClose={() => setIsBulkScanOpen(false)} onImport={handleBulkImport} />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }
      `}</style>
    </div>
  );
};

export default App;
