
import { Character, NewCharacter } from "../types";

// These are the "standard" headers we use for export
const CSV_HEADERS = [
  'record', 'name', 'image', 'pimage', 'type', 'release', 
  'str_init', 'agi_init', 'sta_init', 
  'str_mul_in', 'agi_mul_in', 'sta_mul_in', 
  'bmv_str', 'bmv_agi', 'bmv_sta', 'chinese'
];

export const exportToCSV = (data: Character[]) => {
  if (data.length === 0) return;

  const csvRows = [
    CSV_HEADERS.join(','),
    ...data.map(row => 
      CSV_HEADERS.map(fieldName => {
        const value = (row as any)[fieldName];
        // Special handling for boolean chinese flag
        if (fieldName === 'chinese') return value ? "TRUE" : "";
        
        const formattedValue = typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        return formattedValue === null || formattedValue === undefined ? "" : formattedValue;
      }).join(',')
    )
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `game_db_sync_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (text: string): NewCharacter[] => {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  // Normalize headers to lowercase for comparison
  const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const results: NewCharacter[] = [];

  const numericFields = [
    'str_init', 'agi_init', 'sta_init', 
    'str_mul_in', 'agi_mul_in', 'sta_mul_in', 
    'bmv_str', 'bmv_agi', 'bmv_sta'
  ];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let char of lines[i]) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const charObj: any = {};
    rawHeaders.forEach((header, index) => {
      let val: string = values[index]?.replace(/^"|"$/g, '') || '';
      let key = header;
      
      // FUZZY MAPPING: Handle 'ir' vs 'in' and other potential spreadsheet typos
      if (key.includes('str_mul')) key = 'str_mul_in';
      else if (key.includes('agi_mul')) key = 'agi_mul_in';
      else if (key.includes('sta_mul')) key = 'sta_mul_in';
      else if (key.includes('str_init')) key = 'str_init';
      else if (key.includes('agi_init')) key = 'agi_init';
      else if (key.includes('sta_init')) key = 'sta_init';

      if (numericFields.includes(key)) {
        const parsed = parseFloat(val);
        charObj[key] = isNaN(parsed) ? 0 : parsed;
      } else if (key === 'chinese') {
        const upper = val.toUpperCase();
        // Capture any variation of true
        charObj[key] = upper === 'TRUE' || val === '1' || upper === 'T' || upper === 'YES';
      } else if (key !== 'id') {
        charObj[key] = val;
      }
    });
    
    if (charObj.name) {
      // Safety check: ensure all core multipliers are at least 0 if missing
      numericFields.forEach(f => {
        if (typeof charObj[f] !== 'number') charObj[f] = 0;
      });
      results.push(charObj as NewCharacter);
    }
  }

  return results;
};
