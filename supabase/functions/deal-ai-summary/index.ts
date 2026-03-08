const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property, rental, flip, scores } = await req.json();
    const apiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a concise, practical real estate acquisition analyst. Write a 3-4 sentence summary of this deal. Be direct — mention whether this is better as a rental, flip, BRRRR, or pass. Mention the biggest strengths and risks. Do NOT use hype or marketing language.

Property: ${property.address}, ${property.city}, ${property.state} ${property.zip_code}
Asking: $${property.asking_price} | ARV: $${property.estimated_arv} | Rent: $${property.estimated_monthly_rent}/mo
Rehab: $${property.estimated_rehab_low}–$${property.estimated_rehab_high}

Rental Analysis:
- Monthly Cash Flow: $${rental.monthlyCashFlow.toFixed(0)}
- Cap Rate: ${rental.capRate.toFixed(1)}%
- Cash on Cash Return: ${rental.cashOnCashReturn.toFixed(1)}%
- Total Cash Needed: $${rental.totalCashNeeded.toFixed(0)}

Flip Analysis:
- Flip Profit: $${flip.flipProfitLow.toFixed(0)}–$${flip.flipProfitHigh.toFixed(0)}
- MAO: $${flip.mao.toFixed(0)}
- Holding Costs: $${flip.holdingCosts.toFixed(0)}

Scores:
- Buy & Hold: ${scores.buyHoldScore}/100
- Flip: ${scores.flipScore}/100
- Overall: ${scores.overallScore}/100
- Recommended: ${scores.recommendedStrategy}

Write summary:`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: 'AI usage limit reached. Please add credits.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!response.ok) {
      console.error('AI error:', response.status);
      return new Response(
        JSON.stringify({ error: 'AI summary unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const summary = result.choices?.[0]?.message?.content || 'Summary unavailable.';

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate summary' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
