
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Character, NewCharacter } from './types';
import { CHARACTER_TYPES } from './constants.tsx';
import CharacterModal from './components/CharacterModal';
import BulkScanModal from './components/BulkScanModal';
import StatsRadar from './components/StatsRadar';
import CharacterCard from './components/CharacterCard';
import { exportToCSV, parseCSV } from './utils/csv';
import { 
  fetchCharacters, 
  upsertCharacter, 
  insertBulkCharacters, 
  deleteCharacterFromDb,
  deleteAllCharactersFromDb,
  isDbConnected
} from './services/supabaseService';
import CodeExportModal from './components/CodeExportModal.tsx';

type SortDirection = 'asc' | 'desc' | null;

const LOCAL_STORAGE_KEY = 'vault_engine_local_cache';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassification, setFilterClassification] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkScanOpen, setIsBulkScanOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportChars, setExportChars] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [typeSortDirection, setTypeSortDirection] = useState<SortDirection>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const connected = isDbConnected();

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const dbData = await fetchCharacters();
      if (dbData && dbData.length > 0) {
        setCharacters(dbData);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbData));
      } else {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
          try {
            setCharacters(JSON.parse(localData));
          } catch (e) {
            console.error("Local storage parse failed", e);
          }
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading && !isProcessing) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(characters));
    }
  }, [characters, isLoading, isProcessing]);

  const statsByClassification = useMemo(() => {
    const counts: Record<string, number> = {};
    CHARACTER_TYPES.forEach(type => {
      counts[type] = characters.filter(c => c.type === type).length;
    });
    return counts;
  }, [characters]);

  const processedCharacters = useMemo(() => {
    let filtered = characters.filter(char => {
      const nameMatch = (char.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = (char.type || '').toLowerCase().includes(searchTerm.toLowerCase());
      const releaseMatch = (char.release || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSearch = nameMatch || typeMatch || releaseMatch;
      const matchesClassification = filterClassification ? char.type === filterClassification : true;
      
      return matchesSearch && matchesClassification;
    });

    if (typeSortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const indexA = CHARACTER_TYPES.indexOf(a.type);
        const indexB = CHARACTER_TYPES.indexOf(b.type);
        return typeSortDirection === 'asc' ? indexA - indexB : indexB - indexA;
      });
    }

    return filtered;
  }, [characters, searchTerm, filterClassification, typeSortDirection]);

  const handleSave = async (char: Character | NewCharacter) => {
    setIsProcessing(true);
    const savedChar = await upsertCharacter(char);
    if (savedChar) {
      if ('id' in char) {
        setCharacters(prev => prev.map(c => c.id === savedChar.id ? savedChar : c));
        showNotification("Character profile updated.");
      } else {
        setCharacters(prev => [savedChar, ...prev]);
        showNotification("New character entry saved.");
      }
      setIsModalOpen(false);
      setEditingCharacter(null);
    } else {
      showNotification("Failed to synchronize with database.", "error");
    }
    setIsProcessing(false);
  };

  const handleBulkImport = async (newChars: NewCharacter[]) => {
    setIsProcessing(true);
    try {
      const savedChars = await insertBulkCharacters(newChars);
      if (savedChars && savedChars.length > 0) {
        setCharacters(prev => {
          const existingNames = new Set(prev.map(c => c.name.toLowerCase()));
          const uniqueNew = savedChars.filter(c => !existingNames.has(c.name.toLowerCase()));
          return [...uniqueNew, ...prev];
        });
        showNotification(`Import Complete: ${savedChars.length} records processed.`);
      }
    } catch (err) {
      showNotification("Import failed.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanently remove this character?")) {
      setIsProcessing(true);
      const success = await deleteCharacterFromDb(id);
      if (success || !connected) {
        setCharacters(prev => prev.filter(c => c.id !== id));
        if (selectedCharacter?.id === id) setSelectedCharacter(null);
        showNotification("Record deleted.");
      }
      setIsProcessing(false);
    }
  };

  const handleClearAll = async () => {
    if (confirm("Wipe all characters in the current view?")) {
      setIsProcessing(true);
      const idsToDelete = processedCharacters.map(c => c.id);
      const success = await deleteAllCharactersFromDb(idsToDelete);
      if (success || !connected) {
        setCharacters(prev => prev.filter(c => !idsToDelete.includes(c.id)));
        setSelectedCharacter(null);
        showNotification(`Registry cleared.`);
      }
      setIsProcessing(false);
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
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        const importedData = parseCSV(text);
        if (importedData.length > 0) {
          await handleBulkImport(importedData);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const openSingleExport = (char: Character) => {
    setExportChars([char]);
    setIsExportOpen(true);
  };

  const openBulkExport = () => {
    setExportChars(processedCharacters);
    setIsExportOpen(true);
  };

  const getClassificationColor = (type: string) => {
    const purpleTier = ['Shippuden', 'Bankai', 'Resurrected', 'Espadas'];
    const redTier = ['Lieutenants', 'Akatsuki', 'Heroes of the Villages', 'Captains', 'Kages', 'Yonkos & Mugiwaras'];
    const pinkTier = ['S-Rank', 'Legends', 'Limited Legends'];
    const goldTier = ['Mythics'];
    if (goldTier.includes(type)) return 'from-yellow-400 to-yellow-600 shadow-yellow-500/20';
    if (purpleTier.includes(type)) return 'from-purple-500 to-purple-700 shadow-purple-500/20';
    if (redTier.includes(type)) return 'from-red-500 to-red-700 shadow-red-500/20';
    if (pinkTier.includes(type)) return 'from-pink-400 to-pink-600 shadow-pink-500/20';
    return 'from-slate-600 to-slate-700 shadow-slate-500/10';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />

      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
            <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Processing...</p>
          </div>
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-full shadow-2xl border flex items-center gap-3 animate-bounce
          ${notification.type === 'success' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
          <span className="text-sm font-bold">{notification.message}</span>
        </div>
      )}

      <header className="bg-black border-b border-slate-900 px-8 py-5 flex flex-wrap gap-6 justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 flex items-center justify-center">
            <img src="/pockie-ninja.jpg" alt="PN" className="h-full w-full object-contain" onError={(e) => { e.currentTarget.src = "https://placehold.co/60x60/4f46e5/ffffff?text=PN"; }} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">Vault Engine</h1>
            <div className="flex items-center gap-2 mt-1">
               <div className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'}`}></div>
               <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{connected ? 'Online' : 'Local Archive'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search Records..."
              className="bg-slate-900 border border-slate-800 rounded-lg px-5 py-2.5 pl-12 text-sm text-white focus:ring-1 focus:ring-indigo-500 w-80 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-4 top-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsBulkScanOpen(true)} className="px-4 py-2 border border-indigo-500/30 bg-indigo-500/5 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all rounded-lg">Scan</button>
            <button onClick={handleImportClick} className="px-4 py-2 border border-slate-800 text-[10px] font-bold text-slate-400 hover:bg-slate-900 rounded-lg uppercase">Import</button>
            <button onClick={openBulkExport} className="px-4 py-2 border border-indigo-600/30 bg-indigo-600/5 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all rounded-lg">Bulk C#</button>
            <button onClick={() => exportToCSV(characters)} className="px-4 py-2 border border-slate-800 text-[10px] font-bold text-slate-400 hover:bg-slate-900 rounded-lg uppercase">CSV</button>
          </div>
          <button onClick={() => { setEditingCharacter(null); setIsModalOpen(true); }} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-900/20 rounded-lg">New Record</button>
        </div>
      </header>

      <div className="px-8 py-6 overflow-x-auto bg-[#0a0a0a] border-b border-slate-900">
        <div className="flex gap-3 pb-2 no-scrollbar">
          <div onClick={() => setFilterClassification(null)} className={`min-w-[120px] flex-shrink-0 cursor-pointer p-4 border rounded-xl transition-all ${!filterClassification ? 'bg-indigo-600 border-indigo-400' : 'bg-black border-slate-800'}`}>
            <div className={`text-[9px] font-black uppercase tracking-widest ${!filterClassification ? 'text-indigo-100' : 'text-slate-500'}`}>Global View</div>
            <div className="text-xl font-black mt-1 text-white">{characters.length}</div>
          </div>
          {CHARACTER_TYPES.map(type => (
            <div key={type} onClick={() => setFilterClassification(type === filterClassification ? null : type)} className={`min-w-[140px] flex-shrink-0 cursor-pointer p-4 border rounded-xl transition-all ${filterClassification === type ? `bg-gradient-to-br ${getClassificationColor(type)} text-white` : 'bg-black border-slate-800 hover:border-slate-700'}`}>
              <div className="text-[9px] font-black uppercase tracking-widest opacity-80">{type}</div>
              <div className="text-xl font-black mt-1">{statsByClassification[type] || 0}</div>
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto p-8 bg-[#050505]">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
              <span className="h-4 w-1 bg-indigo-500 rounded-full"></span> 
              Archive {filterClassification ? `// ${filterClassification}` : '// Global'}
            </h2>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-white" onClick={toggleTypeSort}>
              Ranking: <span className="text-indigo-500">{typeSortDirection || 'Default'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {processedCharacters.map(char => (
              <CharacterCard key={char.id} character={char} onEdit={handleEdit} onDelete={handleDelete} onClick={setSelectedCharacter} isSelected={selectedCharacter?.id === char.id} />
            ))}
          </div>
        </div>

        <aside className={`w-[480px] bg-black border-l border-slate-900 p-10 flex flex-col transition-all duration-500 transform ${selectedCharacter ? 'translate-x-0 shadow-[-20px_0_40px_rgba(0,0,0,0.8)]' : 'translate-x-full absolute right-0'}`}>
          {selectedCharacter && (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-1 bg-indigo-500"></div>
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Analysis</h3>
                </div>
                <button onClick={() => setSelectedCharacter(null)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-900 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="flex-1 space-y-12 overflow-y-auto pr-4 custom-scrollbar">
                <div className="flex justify-center scale-110 origin-top">
                   <CharacterCard character={selectedCharacter} onEdit={handleEdit} onDelete={handleDelete} onClick={() => {}} isSelected={false} />
                </div>
                <div className="bg-[#0a0a0a] border border-slate-800 p-8 rounded-[32px]">
                   <StatsRadar character={selectedCharacter} />
                </div>
                <div className="space-y-4 pb-12">
                   <button 
                     onClick={() => openSingleExport(selectedCharacter)}
                     className="w-full p-6 bg-indigo-600/10 border border-indigo-500/30 rounded-[24px] group hover:bg-indigo-600 transition-all text-left"
                   >
                      <div className="text-[10px] font-black text-indigo-400 group-hover:text-indigo-200 uppercase tracking-widest mb-1">C# Engine Export</div>
                      <div className="flex items-center justify-between">
                         <div className="text-xl font-black text-white">Generate Outfit Code</div>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                         </svg>
                      </div>
                   </button>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-900/30 border border-slate-800 rounded-2xl">
                         <div className="text-[9px] text-slate-500 font-black uppercase mb-1">Chinese</div>
                         <div className="text-white text-sm font-black">{selectedCharacter.chinese ? 'Enabled' : 'Disabled'}</div>
                      </div>
                      <div className="p-5 bg-slate-900/30 border border-slate-800 rounded-2xl">
                         <div className="text-[9px] text-slate-500 font-black uppercase mb-1">Scaling</div>
                         <div className="text-white text-sm font-black">{(selectedCharacter.str_mul_in + selectedCharacter.agi_mul_in + selectedCharacter.sta_mul_in).toFixed(2)}x</div>
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
      <CodeExportModal
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        characters={exportChars} 
      />

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
