// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// const llm = new ChatGoogleGenerativeAI({
//   apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
//   // model: "gemini-2.0-flash",
//   model: "gemini-3.5-flash",
//   // model: "gemini-1.5-flash",
// });

// export async function getAnswer(question: string): Promise<string> {
//   try {
//     const res = await llm.invoke(question);
//     return typeof res.content === "string"
//       ? res.content
//       : JSON.stringify(res.content);
//   } catch (error) {
//     console.log("Error in getAnswer:", error);
//     return "";
//   }
// }

// export async function streamAnswer(
//   question: string,
//   onChunk: (chunk: string) => void,
//   onError?: (message: string) => void
// ) {
//   try {
//     const stream = await llm.stream(question);

//     for await (const chunk of stream) {
//       const text = chunk.content as string;
//       onChunk(text);
//     }
//   } catch (error) {
//     if (error?.status === 429) {
//       onError?.("Too many requests. Please wait a moment and try again.");
//     } else {
//       onError?.("Something went wrong. Please try again.");
//     }
//   }
// }

import { ChatGroq } from "@langchain/groq";
import { webSearch } from "./tavily";

const llm = new ChatGroq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  // model: "llama-3.1-8b-instant"
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



// export async function getAnswer(question: string): Promise<string> {
//   try {
//     const res = await llm.invoke(question);

//     return typeof res.content === "string"
//       ? res.content
//       : JSON.stringify(res.content);
//   } catch (error) {
//     console.error("Error in getAnswer:", error);
//     return "";
//   }
// }






// export async function getAnswer(question: string): Promise<string> {
//   try {
//     // 1. Detect if we need live data
//     const needsWeb =
//       /latest|today|news|2026|current|price|who won|update/i.test(question);

//     let context = "";

//     if (needsWeb) {
//       const results = await webSearch(question);

//       context = results
//         .map((r) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}\n`)
//         .join("\n");
//     }

//     // 2. Build prompt
//     const prompt = `
// You are a helpful assistant.

// If context is provided, use it as latest information.

// Context:
// ${context || "No web context needed."}

// Question:
// ${question}

// Answer in a clear and concise way.
// `;

//     const res = await llm.invoke(prompt);

//     return typeof res.content === "string"
//       ? res.content
//       : JSON.stringify(res.content);
//   } catch (error) {
//     console.error(error);
//     return "";
//   }
// }






// export async function streamAnswer(
//   question: string,
//   onChunk: (chunk: string) => void,
//   onError?: (message: string) => void
// ) {
//   try {
//     const stream = await llm.stream(question);

//     for await (const chunk of stream) {
//       const text =
//         typeof chunk.content === "string"
//           ? chunk.content
//           : JSON.stringify(chunk.content);

//       onChunk(text);
//     }
//   } catch (error: unknown) {
//     if (typeof error === "object" && error && "status" in error && (error as { status?: number }).status === 429) {
//       onError?.("Too many requests. Please wait a moment and try again.");
//     } else {
//       onError?.("Something went wrong. Please try again.");
//     }
//   }
// }

export async function streamAnswer(
  question: string,
  onChunk: (chunk: string) => void,
  onError?: (message: string) => void
) {
  try {
    // const needsWeb = /latest|today|news|2026|current|price|update/i.test(
    //   question
    // );
    const needsWeb = await shouldUseWeb(question);

    let context = "";

    if (needsWeb) {
      const results = await webSearch(question);

      context = results.map((r) => `${r.title}: ${r.content}`).join("\n");
    }

    const prompt = `
Use context if available.

Context:
${context}

Question:
${question}
`;

    const stream = await llm.stream(prompt);

    for await (const chunk of stream) {
      const text =
        typeof chunk.content === "string"
          ? chunk.content
          : JSON.stringify(chunk.content);

      onChunk(text);
    }
  } catch (error) {
    if (error?.status === 429) {
      onError?.("Too many requests. Try again shortly.");
    } else {
      onError?.("Something went wrong.");
    }
  }
}
