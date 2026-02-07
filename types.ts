
export interface Character {
  id: string;
  record: string;
  name: string;
  image: string;
  pimage: string;
  type: string;
  release: string;
  str_init: number;
  agi_init: number;
  sta_init: number;
  str_mul_in: number;
  agi_mul_in: number;
  sta_mul_in: number;
  bmv_str: number;
  bmv_agi: number;
  bmv_sta: number;
  chinese: string | boolean;
}

export type NewCharacter = Omit<Character, 'id'>;
