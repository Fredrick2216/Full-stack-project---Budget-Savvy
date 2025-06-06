
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, chatHistory } = await req.json();

    if (!OPENAI_API_KEY) {
      throw new Error('Missing OpenAI API key');
    }

    const sanitizedHistory = chatHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // Create system message
    const systemMessage = {
      role: "system",
      content: `You are a knowledgeable financial assistant that provides helpful, accurate, and concise advice. 
      Focus on personal finance topics like budgeting, saving, investing, debt management, and financial planning.
      Be precise and direct in your responses. Format your responses with markdown for readability when appropriate.
      Never make up financial facts and acknowledge when you don't know something.
      Avoid using generic phrases like "As an AI assistant" or "I'm here to help".`
    };

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [systemMessage, ...sanitizedHistory, { role: "user", content: query }],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Analyze response to determine category
    const financialCategories = ['budgeting', 'saving', 'investing', 'debt'];
    const content = data.choices[0].message.content.toLowerCase();
    
    let category = 'general';
    for (const cat of financialCategories) {
      if (content.includes(cat)) {
        category = cat;
        break;
      }
    }

    return new Response(
      JSON.stringify({
        response: data.choices[0].message.content,
        category: category
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
