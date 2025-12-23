
import { FunctionDeclaration, GoogleGenAI, Schema, Type } from "@google/genai";
import { NotePage, ChatMessage } from '../types';
import { NEXUS_SYSTEM_PROMPT } from './nexusPrompt';

// Usar la API Key del entorno
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- CONFIGURATION ---
const MAX_CHAT_HISTORY = 20;
const MODEL_NAME = 'gemini-3-flash-preview'; 

// --- REUSABLE SCHEMAS ---

// Estructura Recursiva Estricta para el Esquema Solar
const AsteroidSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["asteroid"] },
    label: { type: Type.STRING, description: "Dato específico, fecha o fórmula. Breve." },
    description: { type: Type.STRING, description: "Explicación del dato." }
  },
  required: ["label", "type"]
};

const MoonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["moon"] },
    label: { type: Type.STRING, description: "Subtema o concepto de soporte." },
    description: { type: Type.STRING, description: "Explicación del subtema." },
    children: { 
        type: Type.ARRAY, 
        items: AsteroidSchema,
        description: "Lista de asteroides (detalles) que orbitan esta luna."
    }
  },
  required: ["label", "type", "children"]
};

const PlanetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["planet"] },
    label: { type: Type.STRING, description: "Categoría Principal (Nivel 1)." },
    description: { type: Type.STRING, description: "Resumen de la categoría." },
    children: {
        type: Type.ARRAY,
        items: MoonSchema,
        description: "Lista de lunas (subtemas) que orbitan este planeta."
    }
  },
  required: ["label", "type", "children"]
};

const SolarSystemRootSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["sun"] },
    label: { type: Type.STRING, description: "TEMA CENTRAL (Nivel 0)." },
    description: { type: Type.STRING, description: "Definición nuclear del tema." },
    children: {
        type: Type.ARRAY,
        items: PlanetSchema,
        description: "Lista de planetas principales ordenados por importancia (Nivel 1)."
    }
  },
  required: ["label", "type", "children"]
};

// --- TOOLS (FUNCTION CALLING) ---

const updateStudyMaterialTool: FunctionDeclaration = {
    name: 'update_study_material',
    description: 'Updates ALL sections of the study notebook simultaneously. Content MUST be PLAIN TEXT (no markdown).',
    parameters: {
        type: Type.OBJECT,
        properties: {
            readingContent: { 
                type: Type.STRING, 
                description: 'Academic reading material. STRICTLY PLAIN TEXT. DO NOT USE MARKDOWN (No **, No ##, No ###). Use UPPERCASE for titles and spacing for structure.' 
            },
            kwl: { 
                type: Type.OBJECT, 
                properties: {
                    know: { type: Type.STRING, description: "Plain text list (use newlines). NO markdown symbols." },
                    want: { type: Type.STRING, description: "Plain text list (use newlines). NO markdown symbols." }
                },
                required: ["know", "want"]
            },
            notes: { 
                type: Type.STRING, 
                description: 'Cornell Notes: Main notes. STRICTLY PLAIN TEXT. DO NOT USE MARKDOWN (No **, No ##). Use indentation or uppercase for structure.' 
            },
            cues: { type: Type.STRING, description: 'Cornell Notes: Left column keywords. Plain text list.' },
            summary: { type: Type.STRING, description: 'Cornell Notes: Bottom summary. PLAIN TEXT paragraph.' },
            solarSchema: SolarSystemRootSchema, 
            quiz: { 
                type: Type.ARRAY, 
                description: "Array of 5 quiz objects",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING, description: "Plain text question. NO MARKDOWN." },
                        answer: { type: Type.STRING, description: "Plain text answer. NO MARKDOWN." }
                    },
                    required: ["question", "answer"]
                }
            },
            flashcards: {
                type: Type.ARRAY,
                description: "Array of 6 flashcard objects",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        front: { type: Type.STRING, description: "Plain text concept. NO MARKDOWN." },
                        back: { type: Type.STRING, description: "Plain text definition. NO MARKDOWN." },
                    },
                    required: ["front", "back"]
                }
            }
        },
        required: ["readingContent", "kwl", "notes", "cues", "summary", "solarSchema", "quiz", "flashcards"]
    }
};

// --- SCHEMAS FOR STRUCTURED OUTPUT ---

const ReferenceSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      author: { type: Type.STRING },
      year: { type: Type.STRING },
      url: { type: Type.STRING, description: "Valid URL if available, else empty string" },
    },
    required: ["title", "author"],
  },
};

const QuizSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING, description: "Plain text question. NO MARKDOWN." },
      answer: { type: Type.STRING, description: "Plain text answer. NO MARKDOWN." },
    },
    required: ["question", "answer"],
  },
};

const FlashcardSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      front: { type: Type.STRING, description: "Plain text concept. NO MARKDOWN." },
      back: { type: Type.STRING, description: "Plain text definition. NO MARKDOWN." },
    },
    required: ["front", "back"],
  },
};

const KWLSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    know: { type: Type.STRING, description: "Clean text list separated by newlines." },
    want: { type: Type.STRING, description: "Clean text list separated by newlines." },
    learned: { type: Type.STRING, description: "Leave empty string" },
  },
  required: ["know", "want"],
};

// --- GENERATORS ---

export const generateNoteSummary = async (notes: string, cues: string): Promise<string> => {
  if (!notes && !cues) return "";
  const ai = getAiClient();
  const prompt = `
    Contexto: Método Cornell de estudio.
    Tarea: Escribe un resumen de síntesis (Fase 3 de NEXUS).
    Entrada:
    - Notas: ${notes.substring(0, 5000)}
    - Cues: ${cues}
    Instrucción: Resume las ideas principales en 3 oraciones densas y conectadas.
    FORMATO ESTRICTO: TEXTO PLANO LIMPIO. PROHIBIDO usar Markdown, negritas (**), headers (##) o viñetas. Solo texto fluido.
  `;
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("NEXUS ocupado. Intenta de nuevo.");
  }
};

export const generateCuesFromNotes = async (notes: string): Promise<string> => {
  if (!notes) return "";
  const ai = getAiClient();
  const prompt = `
    Contexto: Método Cornell.
    Tarea: Generar 'Cues' (Columna izquierda).
    Notas: ${notes.substring(0, 5000)}
    Instrucción: Genera una lista de 4-6 preguntas clave o palabras detonantes.
    FORMATO ESTRICTO: TEXTO PLANO. Usa saltos de línea. NO uses guiones, viñetas ni negritas.
  `;
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating cues:", error);
    throw new Error("Error de conexión con IA.");
  }
};

export const expandStudyMaterial = async (currentNotes: string, topic: string): Promise<string> => {
    const ai = getAiClient();
    const prompt = `
        ACTÚA COMO UN PROFESOR EXPERTO.
        
        Tema: "${topic}"
        Notas Actuales: "${currentNotes.substring(0, 3000)}..."
        
        TAREA: Escribe una CONTINUACIÓN de estas notas para profundizar más en el tema.
        - Añade ejemplos concretos.
        - Explica conceptos avanzados relacionados.
        - Añade una sección de "Curiosidades" o "Aplicación Práctica".
        
        FORMATO: Solo Texto Plano (NO Markdown). Usa Mayúsculas para títulos.
        LONGITUD: Escribe al menos 3-4 párrafos densos.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });
        return response.text || "";
    } catch (e) {
        throw new Error("No se pudo expandir el contenido.");
    }
};

export const suggestReferences = async (topic: string, notes: string): Promise<string> => {
    if (!topic && !notes) return "[]";
    const ai = getAiClient();
    const prompt = `
      Recomienda 3 fuentes bibliográficas académicas reales.
      Topic: "${topic}".
      Context: "${notes.substring(0, 500)}".
    `;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                responseSchema: ReferenceSchema
            }
        });
        return response.text || "[]";
    } catch (error) {
        console.error("Error getting references:", error);
        return "[]";
    }
}

export const generateQuizFromNotes = async (notes: string): Promise<string> => {
  if (!notes) return "[]";
  const ai = getAiClient();
  const prompt = `
    Genera un examen de diagnóstico (5 preguntas).
    REGLA DE ORO: El contenido JSON debe ser TEXTO PLANO LIMPIO. 
    ESTÁ PROHIBIDO USAR MARKDOWN (**negrita**, ## titulos).
    Texto: ${notes.substring(0, 8000)}
  `;
  try {
      const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: { 
              responseMimeType: "application/json",
              responseSchema: QuizSchema
          }
      });
      return response.text || "[]";
  } catch (e) {
      console.error(e);
      throw new Error("Error generando el quiz.");
  }
};

export const generateFlashcardsFromNotes = async (notes: string): Promise<string> => {
  if (!notes) return "[]";
  const ai = getAiClient();
  const prompt = `
    Genera 6 flashcards (Anki).
    REGLA DE ORO: El contenido JSON debe ser TEXTO PLANO LIMPIO. 
    ESTÁ PROHIBIDO USAR MARKDOWN (**negrita**, ## titulos).
    Texto: ${notes.substring(0, 8000)}
  `;
  try {
      const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
          config: { 
              responseMimeType: "application/json",
              responseSchema: FlashcardSchema
          }
      });
      return response.text || "[]";
  } catch (e) {
      console.error(e);
      throw new Error("Error generando flashcards.");
  }
};

export const evaluateQuizAnswer = async (question: string, correctAnswer: string, userAnswer: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = `
    Evalúa la respuesta del alumno.
    Pregunta: ${question}
    Correcta: ${correctAnswer}
    Alumno: ${userAnswer}
    
    Da feedback en 2 frases. TEXTO PLANO SIN FORMATO. NO uses Markdown.
  `;
  try {
     const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
     });
     return response.text || "No se pudo evaluar.";
  } catch (e) {
      return "Error al conectar con el evaluador.";
  }
}

export const generateSolarSchema = async (topic: string, notes: string): Promise<string> => {
    const ai = getAiClient();
    const prompt = `
      Genera un "Esquema Solar NEXUS" (Organizador Gráfico Jerárquico).
      
      OBJETIVO: Estructurar el tema "${topic}" en 4 niveles de profundidad.
      
      NIVELES:
      1. SOL (Sun): El tema central.
      2. PLANETAS (Planets): 4-7 Categorías principales o pilares del tema. Ordenados por importancia lógica (como un reloj).
      3. LUNAS (Moons): 2-4 Subtemas por planeta.
      4. ASTEROIDES (Asteroids): Datos muy específicos, fechas o fórmulas para cada luna.
      
      REGLAS DE FORMATO:
      - JSON PURO recursivo.
      - TEXTO PLANO (Sin Markdown).
      
      Contexto de Apuntes: ${notes.substring(0, 6000)}
    `;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: SolarSystemRootSchema
            }
        });
        return response.text || "{}";
    } catch (e) {
        console.error(e);
        return JSON.stringify({ error: "No se pudo generar el esquema." });
    }
}

export const editSolarSchema = async (currentJson: string, userInstruction: string): Promise<string> => {
    const ai = getAiClient();
    const prompt = `
      MODIFICACIÓN DE ARQUITECTURA JSON (SISTEMA SOLAR).
      
      JSON ACTUAL: ${currentJson}
      INSTRUCCIÓN DEL USUARIO: "${userInstruction}"
      
      TAREA: Modifica el árbol JSON para satisfacer la instrucción.
      - Si pide añadir algo, determina si es Planeta, Luna o Asteroide según la jerarquía.
      - Mantén la estructura recursiva.
      - SOLO TEXTO PLANO en los valores.
    `;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: SolarSystemRootSchema
            }
        });
        return response.text || currentJson;
    } catch (e) {
        console.error("Error editing schema", e);
        throw new Error("No pude modificar el esquema.");
    }
}

export const generateKWL = async (topic: string): Promise<string> => {
    const ai = getAiClient();
    const prompt = `
      Llena columnas K y W para "${topic}".
      FORMATO: Texto plano separado por saltos de línea. SIN guiones, SIN markdown.
    `;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                responseSchema: KWLSchema
            }
        });
        return response.text || "{}";
    } catch (e) {
        return "{}";
    }
}


// NEXUS CHAT FUNCTIONALITY WITH TOOLS
export const sendMessageToNexus = async (history: ChatMessage[], newMessage: string, topicContext: string): Promise<{text: string, toolCalls?: any[]}> => {
    const ai = getAiClient();
    
    // 1. Optimize Context
    const recentHistory = history.slice(-MAX_CHAT_HISTORY).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    let contents = [];
    
    if (recentHistory.length === 0 && topicContext) {
         contents = [{ role: 'user', parts: [{ text: `Hola NEXUS. Estoy estudiando el tema: "${topicContext}". Si te pido generar material, usa tus herramientas.` }] }];
    } else {
         contents = [...recentHistory, { role: 'user', parts: [{ text: newMessage }] }];
    }

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: contents,
            config: {
                systemInstruction: NEXUS_SYSTEM_PROMPT,
                maxOutputTokens: 8192,
                thinkingConfig: { thinkingBudget: 2048 }, // Enable thinking to plan the mass generation
                tools: [{functionDeclarations: [updateStudyMaterialTool]}]
            }
        });

        // Check for function calls
        const functionCalls = response.functionCalls;
        
        return {
            text: response.text || (functionCalls ? "¡He actualizado tu libreta con todo el material completo! Revisa las pestañas." : ""),
            toolCalls: functionCalls
        };

    } catch (error) {
        console.error("Error in NEXUS chat:", error);
        throw new Error("NEXUS está recalibrando sus sensores. Intenta de nuevo.");
    }
};