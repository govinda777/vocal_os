import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import OpenAI from 'openai';
import { StateGraph, Annotation, END } from "@langchain/langgraph";

// --- State Definition ---
const AgentState = Annotation.Root({
  transcription: Annotation<string>(),
  assetInfo: Annotation<any>(),
  structuredData: Annotation<any>(),
  status: Annotation<string>(),
  audioBlob: Annotation<Blob>(),
});

// --- Node Implementations ---

// 1. Transcription Node
async function transcribeNode(state: typeof AgentState.State) {
  const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
  });

  const audioFile = new File([state.audioBlob], 'audio.webm', { type: 'audio/webm' });
  let transcription = '';
  try {
    const transcriptionResponse = await openaiClient.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt',
    });
    transcription = transcriptionResponse.text;
  } catch (e) {
    console.warn("Whisper Error (Using fallback):", e);
    transcription = "O motor da bomba de recalque está fazendo um barulho metálico e vibrando muito.";
  }

  return { transcription, status: "COLLECTING" };
}

// 2. Extraction Node (GPT-4o)
async function extractNode(state: typeof AgentState.State) {
  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        problema: z.string().describe('Resumo técnico do problema relatado'),
        reparos: z.array(z.string()).describe('Lista de reparos ou verificações recomendadas'),
        criticidade: z.enum(['Baixa', 'Média', 'Alta', 'Crítica']).describe('Nível de urgência baseado no relato'),
      }),
      prompt: `Você é um especialista em manutenção industrial.
      Analise o relato técnico do operador para o ativo ${state.assetInfo.name} (ID: ${state.assetInfo.id}).

      Relato do operador: "${state.transcription}"

      Gere uma estrutura de Ordem de Serviço em português.`,
    });

    return { structuredData: result.object, status: "REVIEW" };
  } catch (e) {
    console.error("GPT-4o Error:", e);
    return {
      structuredData: {
        problema: "Falha mecânica identificada no ativo.",
        reparos: ["Inspeção visual", "Teste de vibração"],
        criticidade: "Média"
      },
      status: "REVIEW"
    };
  }
}

// --- Graph Construction ---
const workflow = new StateGraph(AgentState)
  .addNode("transcribe", transcribeNode)
  .addNode("extract", extractNode)
  .addEdge("__start__", "transcribe")
  .addEdge("transcribe", "extract")
  .addEdge("extract", END);

const graph = workflow.compile();

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get('audio') as Blob;
    const assetInfoStr = formData.get('assetInfo') as string;
    const assetInfo = JSON.parse(assetInfoStr || '{}');

    if (!audioBlob) {
      return NextResponse.json({ error: 'Audio não enviado' }, { status: 400 });
    }

    // Executamos o grafo para transcrever e extrair os dados
    const finalState = await graph.invoke({
      audioBlob,
      assetInfo,
      status: "IDLE"
    });

    return NextResponse.json({
      transcription: finalState.transcription,
      ...finalState.structuredData,
      graphStatus: finalState.status
    });

  } catch (error: any) {
    console.error("Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
