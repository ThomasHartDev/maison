import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Dress } from "@/types";
import type { ChatMessage } from "@/types/chat";
import { CHAT_TOOLS, describeProposal, isValidTool } from "@/lib/chat-tools";
import { buildSystemPrompt } from "@/lib/chat-prompt";

const client = new Anthropic();

const MAX_HISTORY = 20;

interface ChatRequest {
  messages: ChatMessage[];
  dresses: Dress[];
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const body = (await req.json()) as ChatRequest;
  const { messages, dresses } = body;

  const systemPrompt = buildSystemPrompt(dresses);

  // Filter out empty system messages and cap history to reduce tokens
  const recent = messages
    .filter(m => m.content.trim().length > 0)
    .slice(-MAX_HISTORY);

  const anthropicMessages = recent.map(m => ({
    role: (m.role === "system" ? "assistant" : "user") as "user" | "assistant",
    content: m.role === "system"
      ? m.content
      : `[${m.role === "company" ? "Co" : "Mfr"}]: ${m.content}`,
  }));

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 512,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: CHAT_TOOLS,
    });

    let reply: string | null = null;
    const proposals: { toolName: string; toolInput: Record<string, unknown>; description: string }[] = [];

    for (const block of response.content) {
      if (block.type === "text") {
        reply = block.text;
      } else if (block.type === "tool_use" && isValidTool(block.name)) {
        const input = block.input as Record<string, unknown>;
        proposals.push({
          toolName: block.name,
          toolInput: input,
          description: describeProposal(block.name, input, dresses),
        });
      }
    }

    return NextResponse.json({ reply, proposals });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
