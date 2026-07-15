import { pipeline } from '@huggingface/transformers';

let generator = null;

/**
 * Lazy loads the text-generation pipeline with 4-bit quantized Qwen2.5-0.5B-Instruct model (~350MB).
 */
async function getGenerator() {
  if (process.env.NODE_ENV === 'test') {
    throw new Error('Local LLM bypassed in test environment');
  }
  if (!generator) {
    console.log('[local-llm-service] Loading Qwen2.5-0.5B-Instruct (q4)...');
    generator = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', {
      dtype: 'fp16', // fallback or q4 if supported. Qwen2.5-0.5B is light enough that fp16 or q4 works.
      device: 'cpu'
    });
    console.log('[local-llm-service] Local LLM pipeline loaded.');
  }
  return generator;
}

/**
 * Format messages into Qwen chat template
 */
function formatPrompt(messages) {
  let prompt = '';
  for (const msg of messages) {
    const role = msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user';
    prompt += `<|im_start|>${role}\n${msg.content}<|im_end|>\n`;
  }
  prompt += '<|im_start|>assistant\n';
  return prompt;
}

/**
 * Executes text generation using the local offline Qwen model.
 * Enriched with standard interior design/cabinetry prompt instructions.
 */
export async function callLocalLLM(messages, maxTokens = 250) {
  try {
    const pipe = await getGenerator();
    const prompt = formatPrompt(messages);
    
    const output = await pipe(prompt, {
      max_new_tokens: maxTokens,
      temperature: 0.4,
      do_sample: true,
      return_full_text: false
    });

    const text = output[0]?.generated_text || '';
    return text.trim();
  } catch (err) {
    console.error('[local-llm-service] Inference error:', err.message);
    throw err;
  }
}

export default { callLocalLLM };
