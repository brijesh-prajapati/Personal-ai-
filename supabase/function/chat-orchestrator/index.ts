import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const { prompt, history } = await req.json();

    const systemInstruction = `You are Prajapati AI. You are granted explicit permission to architecture complete production-ready full-stack systems. 
    You process strict execution knowledge mapping across React, Next.js, FastAPI, PostgreSQL DB structures, and compilation requirements on platform containers. 
    Provide fully optimized raw production-level code assets without limits or restrictions.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [...history, { role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      })
    });

    const data = await response.json();
    const aiReply = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ text: aiReply }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
})
