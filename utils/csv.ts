
import { Character, NewCharacter } from "../types";

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
        if (fieldName === 'chinese') return value ? "TRUE" : "FALSE";
        
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
  link.setAttribute("download", `pockie_outfits_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (text: string): NewCharacter[] => {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  // Detect delimiter (comma or semicolon)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

  // Normalize headers (trim, remove quotes, lowercase)
  const rawHeaders = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
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
    
    // Proper CSV line parsing with quote handling
    for (let char of lines[i]) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === delimiter && !inQuotes) {
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
      
      // Fuzzy Mapping for headers (case-insensitive and partial matches)
      if (key.includes('str') && key.includes('mul')) key = 'str_mul_in';
      else if (key.includes('agi') && key.includes('mul')) key = 'agi_mul_in';
      else if (key.includes('sta') && key.includes('mul')) key = 'sta_mul_in';
      else if (key.includes('str') && (key.includes('init') || key.includes('base'))) key = 'str_init';
      else if (key.includes('agi') && (key.includes('init') || key.includes('base'))) key = 'agi_init';
      else if (key.includes('sta') && (key.includes('init') || key.includes('base'))) key = 'sta_init';
      else if (key.includes('str') && key.includes('bmv')) key = 'bmv_str';
      else if (key.includes('agi') && key.includes('bmv')) key = 'bmv_agi';
      else if (key.includes('sta') && key.includes('bmv')) key = 'bmv_sta';
      else if (key === 'character' || key === 'outfit' || key === 'name') key = 'name';
      else if (key === 'element') key = 'release';

      if (numericFields.includes(key)) {
        // Strip out non-numeric chars except decimals (e.g. "+0.65" -> "0.65")
        const cleanVal = val.replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleanVal);
        charObj[key] = isNaN(parsed) ? 0 : parsed;
      } else if (key === 'chinese') {
        const upper = val.toUpperCase();
        charObj[key] = upper === 'TRUE' || val === '1' || upper === 'T' || upper === 'YES';
      } else {
        charObj[key] = val;
      }
    });
    
    // Only accept if we at least found a name
    if (charObj.name) {
      // Defaults for missing data
      charObj.type = charObj.type || 'Orange';
      charObj.release = charObj.release || 'Fire';
      charObj.image = charObj.image || '';
      charObj.pimage = charObj.pimage || '';
      charObj.record = charObj.record || '';
      
      numericFields.forEach(f => {
        if (typeof charObj[f] !== 'number') charObj[f] = 0;
      });
      
      results.push(charObj as NewCharacter);
    }
  }

  return results;
};
