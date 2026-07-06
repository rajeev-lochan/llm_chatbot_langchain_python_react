import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { webSearch } from "./tavily";

const llm = new ChatGoogleGenerativeAI({
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  model: "gemini-3.5-flash",
});


async function shouldUseWeb(question: string): Promise<boolean> {
  const res = await llm.invoke(`
You are a routing system.

Decide if the question needs real-time web data.

Return ONLY:
YES or NO

Question: ${question}
`);

  const text =
    typeof res.content === "string" ? res.content : "";

  return text.trim().toUpperCase().includes("YES");
}


export async function streamAnswer(
  question: string,
  image: string | undefined,
  onChunk: (chunk: string) => void,
  onError?: (message: string) => void
) {
  try {
    let context = "";

    // Bypass web search if an image is provided
    if (!image) {
      const needsWeb = await shouldUseWeb(question);
      if (needsWeb) {
        const results = await webSearch(question);
        context = results.map((r: any) => `${r.title}: ${r.content}`).join("\n");
      }
    }

    const systemPrompt = `You are a helpful assistant.
If the user asks you to create, generate, draw, paint, design, or show an image (e.g. "create a morning sunrise image"), you must generate the image using the Pollinations AI service.
To do this, respond with a markdown image tag in this format:
![generated image](https://image.pollinations.ai/p/PROMPT?width=1024&height=768&seed=SEED)
Where:
- PROMPT is a highly detailed, descriptive, URL-encoded prompt (convert spaces to %20) optimized for AI image generation. Add descriptive keywords like "cinematic", "photorealistic", "ultra-detailed", "4k resolution" to make it look beautiful.
- SEED is a random integer (e.g., between 1 and 100000) so that subsequent requests for the same prompt generate different images.

Example: If the user says "create a morning sunrise image", respond with:
"Here is the image of a morning sunrise:
![generated image](https://image.pollinations.ai/p/A%20breathtaking%20morning%20sunrise%20over%20misty%20mountains,%20cinematic%20lighting,%20golden%20hour,%20highly%20detailed,%20photorealistic?width=1024&height=768&seed=48392)"

Make sure the prompt inside the URL is fully URL-encoded (e.g., spaces replaced with %20, no special characters like commas or periods in the URL path, just alphanumeric characters and %20).
Do not put the markdown image inside a code block. Output it directly in your response.`;

    let inputPrompt: any;

    if (image) {
      inputPrompt = [
        new SystemMessage({ content: systemPrompt }),
        new HumanMessage({
          content: [
            { type: "text", text: question || "Describe this image" },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        }),
      ];
    } else {
      inputPrompt = [
        new SystemMessage({ content: systemPrompt }),
        new HumanMessage({
          content: `Use context if available.

Context:
${context}

Question:
${question}`,
        }),
      ];
    }

    const stream = await llm.stream(inputPrompt);

    for await (const chunk of stream) {
      const text =
        typeof chunk.content === "string"
          ? chunk.content
          : JSON.stringify(chunk.content);

      onChunk(text);
    }
  } catch (error: any) {
    if (error?.status === 429) {
      onError?.("Too many requests. Try again shortly.");
    } else {
      console.error("Gemini stream error:", error);
      onError?.("Something went wrong.");
    }
  }
}
