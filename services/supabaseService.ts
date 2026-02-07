
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Character, NewCharacter } from '../types';

// Retrieve environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error("Supabase initialization failed:", e);
  }
}

export { supabase };

/**
 * Checks if the Supabase client is available for use.
 */
export const isDbConnected = (): boolean => {
  return !!supabase && typeof supabase.from === 'function';
};

export const fetchCharacters = async (): Promise<Character[]> => {
  if (!isDbConnected()) return [];
  
  try {
    const { data, error } = await supabase!
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching characters:', error);
      return [];
    }
    return data as Character[];
  } catch (err) {
    console.error('Supabase fetch exception:', err);
    return [];
  }
};

export const upsertCharacter = async (character: Character | NewCharacter): Promise<Character | null> => {
  if (!isDbConnected()) {
    console.warn('Database not connected. Returning local object.');
    // Fix: Simulate local database save with appropriate field generation
    const result: Character = {
      ...character,
      id: ('id' in character) ? character.id : crypto.randomUUID(),
      created_at: new Date().toISOString()
    } as Character;
    return result;
  }

  try {
    const { data, error } = await supabase!
      .from('characters')
      .upsert(character)
      .select()
      .single();

    if (error) {
      console.error('Error upserting character:', error);
      return null;
    }
    return data as Character;
  } catch (err) {
    console.error('Supabase upsert exception:', err);
    return null;
  }
};

export const insertBulkCharacters = async (characters: NewCharacter[]): Promise<Character[]> => {
  if (!isDbConnected()) {
    console.warn('Database not connected. Processing bulk import locally.');
    // Fix: Ensure proper property mapping and type safety for local character creation.
    return characters.map(c => ({
      ...c,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    })) as Character[];
  }

  try {
    const { data, error } = await supabase!
      .from('characters')
      .insert(characters)
      .select();

    if (error) {
      console.error('Error batch inserting characters:', error);
      return [];
    }
    return data as Character[];
  } catch (err) {
    console.error('Supabase bulk insert exception:', err);
    return [];
  }
};

export const deleteCharacterFromDb = async (id: string): Promise<boolean> => {
  if (!isDbConnected()) return true; // Local delete handled in state

  try {
    const { error } = await supabase!
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting character:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase delete exception:', err);
    return false;
  }
};

export const deleteAllCharactersFromDb = async (ids: string[]): Promise<boolean> => {
  if (!isDbConnected()) return true; // Local clear handled in state

  try {
    const { error } = await supabase!
      .from('characters')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error clearing database:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase clear exception:', err);
    return false;
  }
};
