import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const levelInstructions: Record<string, string> = {
  Child:
    "Explain using only simple analogies and everyday language a 5-8 year old would understand. Use 'imagine...' and 'it's like...' framing. Zero jargon.",
  Teen:
    "Explain using real terminology but always define new terms. Use relatable examples a 13-15 year old would connect with. Casual but informative tone.",
  College:
    "Use proper terminology freely. Assume basic literacy in the field. Give a structured, textbook-quality explanation with real-world context.",
  Expert:
    "Full technical depth. Include formulas, models, or frameworks where relevant. Assume domain knowledge. Be precise and concise.",
  Researcher:
    "Cover cutting-edge nuance, open questions, active debates, edge cases, and recent developments. Reference specific research directions or papers where relevant.",
};

export async function POST(req: Request) {
  const { concept, level, analogyMode } = await req.json();

  if (!concept || !level) {
    return new Response(JSON.stringify({ error: "Missing concept or level" }), {
      status: 400,
    });
  }

  const levelInstruction = levelInstructions[level] || levelInstructions.College;

  let systemPrompt = `You are ELI-X, a world-class explanation engine. Your only job is to explain concepts clearly at the requested complexity level. Do not answer questions unrelated to explaining concepts. Do not engage in general conversation. If the user input is not a concept to explain, politely redirect them.

IMPORTANT FORMATTING RULES: Do not use markdown formatting in your responses. Do not use asterisks for bold or italic text. Do not use hashtags for headings. Do not use dashes or asterisks for bullet points. Write in plain text only with natural paragraph breaks. If you need to list items, use simple numbered lists (1. 2. 3.) or write them as part of flowing sentences.

IMPORTANT LENGTH RULE: Keep your explanation concise — maximum 2 short paragraphs. Be clear and direct. Never write more than 150 words. Quality over quantity.

Complexity level: ${level}
${levelInstruction}`;

  if (analogyMode) {
    systemPrompt +=
      "\n\nExplain this primarily through one vivid, creative analogy.";
  }

  const stream = client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: `Explain: ${concept}` }],
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event.delta.text)}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[ELI-X API Error]", message);
        if (err instanceof Error && err.stack) {
          console.error(err.stack);
        }
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify("[Error generating explanation]")}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
