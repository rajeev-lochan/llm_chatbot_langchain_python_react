// import { TavilyClient } from "@tavily/core";

// const tavily = new TavilyClient({
//   apiKey: import.meta.env.VITE_TAVILY_API_KEY,
// });

// export async function webSearch(query: string) {
//   const result = await tavily.search({
//     query,
//     max_results: 5,
//   });

//   return result.results.map((r) => ({
//     title: r.title,
//     url: r.url,
//     content: r.content,
//   }));
// }

export async function webSearch(query: string) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: import.meta.env.VITE_TAVILY_API_KEY,
      query,
      max_results: 5,
    }),
  });

  const data = await res.json();

  return data.results.map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
  }));
}
