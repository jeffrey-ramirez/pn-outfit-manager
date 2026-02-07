
import React from 'react';
import { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  onEdit: (char: Character) => void;
  onDelete: (id: string) => void;
  onClick: (char: Character) => void;
  isSelected: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, onEdit, onDelete, onClick, isSelected }) => {
  const getReleaseIcon = (release: string) => {
    switch (release.toLowerCase()) {
      case 'fire': return '🔥';
      case 'water': return '💧';
      case 'wind': return '🌪️';
      case 'earth': return '🪨';
      case 'lightning': return '⚡';
      default: return '🛡️';
    }
  };

  const getNameColor = (type: string): string => {
    switch (type) {
      case "Grey":
        return "#A9A9A9"; // DarkGray
      case "Blue":
        return "#388EE9"; // FromArgb(56, 142, 233)
      case "Orange":
        return "#FFA500"; // FromArgb(255, 165, 0)
      case "Shippuden":
      case "Bankai":
      case "Resurrected":
      case "Espadas":
        return "#A335EE"; // FromArgb(163, 53, 238) - Purple
      case "S-Rank":
      case "Legends":
      case "Limited Legends":
        return "#FF6470"; // FromArgb(255, 100, 112) - Pinkish Red
      case "Lieutenants":
      case "Akatsuki":
      case "Heroes of the Villages":
      case "Captains":
      case "Kages":
      case "Yonkos & Mugiwaras":
        return "#FF0000"; // FromArgb(255, 0, 0) - Red
      case "Mythics":
        return "#FFD700"; // FromArgb(255, 215, 0) - Gold
      default:
        return "#A9A9A9"; // Default DarkGray
    }
  };

  return (
    <div 
      onClick={() => onClick(character)}
      className={`relative w-80 bg-black/90 border-2 rounded-sm overflow-hidden transition-all duration-300 group cursor-pointer ${
        isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-[1.02]' : 'border-slate-800 hover:border-slate-600'
      }`}
      style={{
        boxShadow: isSelected ? '0 0 30px rgba(79, 70, 229, 0.3)' : 'none'
      }}
    >
      {/* Action Overlays */}
      <div className="absolute top-2 right-2 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(character); }}
          className="p-1.5 bg-slate-800/80 hover:bg-indigo-600 rounded text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(character.id); }}
          className="p-1.5 bg-slate-800/80 hover:bg-red-600 rounded text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Card Header */}
      <div className="bg-[#0c0c0c] px-3 py-2 border-b border-slate-900">
        <div className="flex justify-between items-start">
          <h3 
            className="font-bold text-sm leading-tight" 
            style={{ color: getNameColor(character.type) }}
          >
            {character.name} + 0
          </h3>
          <div className="text-white opacity-40 text-[10px] font-mono">{character.record}</div>
        </div>
        <div className="text-white/80 text-[11px] mt-0.5">Bound</div>
        <div className="text-white/80 text-[11px]">Item Type: <span className="text-white">Outfit</span></div>
        <div className="text-white/80 text-[11px]">Weapon Type: <span className="text-white">Sharp</span></div>
      </div>

      <div className="h-[1px] bg-[#ffcc00]/50 mx-1"></div>

      {/* Level and Synthesis */}
      <div className="px-3 py-1 flex justify-between text-[11px] text-white">
        <span>Required Level</span>
        <span>1</span>
      </div>
      
      <div className="h-[1px] bg-[#ffcc00]/50 mx-1"></div>
      
      <div className="px-3 py-1 flex justify-between text-[11px] text-white">
        <span>Synthesis Value</span>
        <span>42</span>
      </div>

      <div className="h-[1px] bg-[#ffcc00]/50 mx-1"></div>

      {/* Core Stats */}
      <div className="px-3 py-2 space-y-0.5">
        <div className="flex justify-between text-[11px] text-white font-medium">
          <span>Strength</span>
          <span>{character.str_init} (+{character.str_mul_in.toFixed(2)})</span>
        </div>
        <div className="flex justify-between text-[11px] text-white font-medium">
          <span>Agility</span>
          <span>{character.agi_init} (+{character.agi_mul_in.toFixed(2)})</span>
        </div>
        <div className="flex justify-between text-[11px] text-white font-medium">
          <span>Stamina</span>
          <span>{character.sta_init} (+{character.sta_mul_in.toFixed(2)})</span>
        </div>
      </div>

      <div className="h-[1px] bg-[#ffcc00]/50 mx-1"></div>

      {/* Passive Mechanics (BMV) */}
      <div className="px-3 py-2 space-y-2 text-[10px] leading-tight">
        <p className="text-white">
          Every <span className="text-[#ffcc00]">{character.bmv_str}</span> points of Strength increases attack by 1% and block by 1 point
        </p>
        <p className="text-white">
          Every <span className="text-[#ffcc00]">{character.bmv_agi}</span> points of Agility increases speed by 1% and dodge by 1 point
        </p>
        <p className="text-white">
          Every <span className="text-[#ffcc00]">{character.bmv_sta}</span> points of Stamina increases health and chakra by 1%
        </p>
      </div>

      <div className="h-[1px] bg-[#ffcc00]/50 mx-1"></div>

      {/* Secret Technique / Mastery */}
      <div className="px-3 py-2">
        <h4 className="text-[#66ccff] text-[10px] font-bold mb-1">Secret Technique:</h4>
        <p className="text-[#66ccff] text-[10px] leading-tight mb-2">
          10% chance to unleash a powerful move when enemy below 15% health.
        </p>
        <p className="text-[#66ccff] text-[10px] leading-tight">
          {character.type} tier scaling enabled.
        </p>
      </div>

      <div className="h-[1px] bg-[#ffcc00]/50 mx-1"></div>

      {/* Master Section */}
      <div className="px-3 py-2 bg-[#0a0a0a]">
        <h4 className="text-[#66ccff] text-[10px] font-bold mb-1 capitalize">{character.release} Master:</h4>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{getReleaseIcon(character.release)}</span>
          <span className="text-[#66ccff] text-[10px] font-medium">* Increase {character.release} Release by 15%</span>
        </div>
        
        {character.chinese && (
          <div className="mt-2 text-[9px] font-black text-red-500/80 tracking-tighter uppercase italic">
            [ CHINESE REGION VERIFIED ]
          </div>
        )}
      </div>

      {/* Card Border Inner Shadow */}
      <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-sm"></div>
    </div>
  );
};

export default CharacterCard;
