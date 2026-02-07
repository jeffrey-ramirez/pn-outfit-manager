
import { GoogleGenAI, Type } from "@google/genai";
import { NewCharacter } from "../types";

const CHARACTER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    str_init: { type: Type.NUMBER },
    agi_init: { type: Type.NUMBER },
    sta_init: { type: Type.NUMBER },
    str_mul_in: { type: Type.NUMBER },
    agi_mul_in: { type: Type.NUMBER },
    sta_mul_in: { type: Type.NUMBER },
    bmv_str: { type: Type.NUMBER },
    bmv_agi: { type: Type.NUMBER },
    bmv_sta: { type: Type.NUMBER },
    release: { type: Type.STRING },
    type: { type: Type.STRING }
  }
};

export const generateCharacterStats = async (name: string, description: string): Promise<Partial<NewCharacter>> => {
  // Always initialize AI client inside functions using the API_KEY env variable directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate balanced game stats for a character named "${name}" based on this description: "${description}". 
      Ensure multipliers (str_mul_in, agi_mul_in, sta_mul_in) are between 0.1 and 2.0.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            record: { type: Type.STRING },
            type: { type: Type.STRING },
            release: { type: Type.STRING },
            str_init: { type: Type.NUMBER },
            agi_init: { type: Type.NUMBER },
            sta_init: { type: Type.NUMBER },
            str_mul_in: { type: Type.NUMBER },
            agi_mul_in: { type: Type.NUMBER },
            sta_mul_in: { type: Type.NUMBER },
            bmv_str: { type: Type.NUMBER },
            bmv_agi: { type: Type.NUMBER },
            bmv_sta: { type: Type.NUMBER },
            chinese: { type: Type.BOOLEAN },
          },
          required: [
            "str_init", "agi_init", "sta_init", 
            "str_mul_in", "agi_mul_in", "sta_mul_in",
            "type", "release"
          ]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini Stats Generation Error:", error);
    throw error;
  }
};

export const extractStatsFromImage = async (base64Image: string): Promise<Partial<NewCharacter>> => {
  // Always initialize AI client inside functions using the API_KEY env variable directly
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/png',
        data: base64Image.split(',')[1] || base64Image,
      },
    };

    const prompt = `Analyze this game character card and extract all statistics.
    - name: Character name
    - str_init, agi_init, sta_init: The primary stats (numeric)
    - str_mul_in, agi_mul_in, sta_mul_in: The gains in parentheses (e.g. +0.65 -> 0.65)
    - bmv_str, bmv_agi, bmv_sta: The threshold values in the description (e.g. "Every 17 points of Strength" -> 17)
    - release: Element name at bottom.
    Return JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: CHARACTER_SCHEMA
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error("Vision AI returned no text");
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

export const extractStatsFromMultipleImages = async (base64Images: string[]): Promise<Partial<NewCharacter>[]> => {
  // Always initialize AI client inside functions using the API_KEY env variable directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const parts = base64Images.map(img => ({
      inlineData: {
        mimeType: 'image/png',
        data: img.split(',')[1] || img,
      },
    }));

    const prompt = `I am providing multiple screenshots of game character cards. Extract the stats for EACH image into an array of objects.
    Format each object with:
    - name, str_init, agi_init, sta_init
    - str_mul_in, agi_mul_in, sta_mul_in (from parentheses)
    - bmv_str, bmv_agi, bmv_sta (from the "Every X points..." text)
    - release, type
    Return an ARRAY of objects.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [...parts, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: CHARACTER_SCHEMA
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return [];
  } catch (error) {
    console.error("Batch Vision Error:", error);
    throw error;
  }
};
