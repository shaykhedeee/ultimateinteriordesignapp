import { openRouterKey } from './provider-config.js';

function geminiKeys() {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_AI_STUDIO_KEY_1,
    process.env.GOOGLE_AI_STUDIO_KEY_2
  ].filter(Boolean);
}

export function getGeminiStatus() {
  return {
    configured: geminiKeys().length > 0,
    enabled: process.env.GEMINI_PROMPT_REFINEMENT !== 'false',
    model: process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash'
  };
}

async function tryRefineWithOpenRouter({ prompt, instruction }) {
  const key = openRouterKey();
  if (!key) return null;
  try {
    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Spacious Venture Studio'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: instruction }],
        temperature: 0.2
      })
    });
    if (!response.ok) {
      throw new Error(`OpenRouter status ${response.status}`);
    }
    const payload = await response.json();
    const refined = payload?.choices?.[0]?.message?.content?.trim();
    if (!refined) {
      throw new Error('OpenRouter returned empty content');
    }
    return refined;
  } catch (err) {
    console.warn('OpenRouter fallback refinement failed:', err.message);
    return null;
  }
}

export async function refineRenderPromptWithGemini({ prompt, room, style, budgetTier, layoutConstraints }) {
  const instruction = [
    'You are the final prompt editor for an Indian interior-design render studio.',
    'Rewrite the supplied image-generation prompt into one precise professional prompt.',
    'Do not remove, weaken, or contradict any floor-plan zone, component marker, furniture, material, budget, or correction rule.',
    'Do not invent dimensions, openings, furniture, or architectural elements.',
    'Preserve these non-negotiable render constraints: Lumion-like professional 3D architectural render, no humans, no human figures, no silhouettes, no mannequins, no pets, no text, no logos, no watermarks, no fantasy objects, no unrequested furniture.',
    'Keep it concise enough for an image model, but explicit about layout accuracy and Indian residential context.',
    'Return only the rewritten prompt without markdown or commentary.',
    `Room: ${room}. Style: ${style}. Budget tier: ${budgetTier}.`,
    `Layout constraints JSON: ${JSON.stringify(layoutConstraints)}.`,
    `Source prompt: ${prompt}`
  ].join('\n');

  const status = getGeminiStatus();
  if (status.configured && status.enabled) {
    for (const apiKey of geminiKeys()) {
      try {
        const endpoint = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${status.model}:generateContent`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: instruction }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1400
            }
          })
        });
        if (response.ok) {
          const payload = await response.json();
          const refinedPrompt = payload?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || '')
            .join(' ')
            .trim();
          if (refinedPrompt) {
            return { prompt: refinedPrompt, provider: `gemini:${status.model}`, refined: true };
          }
        } else if (![401, 403, 429].includes(response.status)) {
          console.warn(`Gemini server returned ${response.status}, trying next configured key.`);
        }
      } catch (err) {
        console.warn(`Gemini prompt refinement failed with a configured key, trying next: ${err.message}`);
      }
    }
  }

  // Fallback to OpenRouter
  const openRouterRefined = await tryRefineWithOpenRouter({ prompt, instruction });
  if (openRouterRefined) {
    return { prompt: openRouterRefined, provider: 'openrouter:meta-llama-3.3-free', refined: true };
  }

  return { prompt, provider: 'deterministic-compiler', refined: false };
}
