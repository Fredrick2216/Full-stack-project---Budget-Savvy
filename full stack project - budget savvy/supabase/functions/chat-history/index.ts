
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client using env vars
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { action, userId, messages, messageId, searchTerm, category } = await req.json();

  try {
    switch (action) {
      case 'save':
        // Save chat messages to database
        if (!userId || !messages || messages.length === 0) {
          throw new Error('Missing required fields');
        }

        // Save each message in the conversation
        const savePromises = messages.map(async (msg: any) => {
          const { data, error } = await supabaseClient
            .from('chat_history')
            .upsert({
              id: msg.id,
              user_id: userId,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
              category: msg.category || 'general'
            });

          if (error) throw error;
          return data;
        });

        await Promise.all(savePromises);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get':
        // Get chat history for user
        if (!userId) {
          throw new Error('Missing user ID');
        }

        let query = supabaseClient
          .from('chat_history')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false });

        if (category) {
          query = query.eq('category', category);
        }

        if (searchTerm) {
          query = query.ilike('content', `%${searchTerm}%`);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        return new Response(
          JSON.stringify({ messages: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'delete':
        // Delete a specific message
        if (!messageId) {
          throw new Error('Missing message ID');
        }

        const { error: deleteError } = await supabaseClient
          .from('chat_history')
          .delete()
          .eq('id', messageId)
          .eq('user_id', userId);
        
        if (deleteError) throw deleteError;
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Chat history function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
