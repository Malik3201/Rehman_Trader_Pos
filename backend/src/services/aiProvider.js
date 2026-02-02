import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Parse receipt/invoice text using AI provider
 * Returns structured JSON with items
 */
async function parseReceiptText(rawText) {
  const provider = env.AI_PROVIDER.toLowerCase();
  const apiKey = getApiKeyForProvider(provider);

  if (!apiKey) {
    // For development: return mock parsed data if no API key
    logger.warn('AI provider not configured, using mock data');
    return {
      supplier: 'Test Supplier',
      items: [
        {
          name: 'Product A',
          qty: 10,
          unit: 'pcs',
          unitCost: 25.0,
          lineTotal: 250.0,
        },
        {
          name: 'Product B',
          qty: 5,
          unit: 'kg',
          unitCost: 50.0,
          lineTotal: 250.0,
        },
      ],
    };
  }

  switch (provider) {
    case 'groq':
      return await parseWithGroq(rawText, apiKey);
    case 'longcat':
      return await parseWithLongCat(rawText, apiKey);
    default:
      const err = new Error(`Unsupported AI provider: ${provider}. Only 'groq' and 'longcat' are supported.`);
      err.statusCode = 400;
      err.errorCode = 'UNSUPPORTED_AI_PROVIDER';
      throw err;
  }
}

function getApiKeyForProvider(provider) {
  switch (provider) {
    case 'groq':
      return env.GROQ_API_KEY || env.AI_API_KEY;
    case 'longcat':
      return env.LONGCAT_API_KEY || env.AI_API_KEY;
    default:
      return env.AI_API_KEY;
  }
}

/**
 * Parse with Groq API
 */
async function parseWithGroq(rawText, apiKey) {
  const prompt = buildPrompt(rawText);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a receipt parsing assistant. Extract structured data from receipt text and return ONLY valid JSON, no markdown, no explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Groq API error', { status: response.status, error: errorText });
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in Groq response');
    }

    return JSON.parse(content);
  } catch (error) {
    logger.error('Error parsing with Groq', error);
    throw error;
  }
}

/**
 * Parse with LongCat API (placeholder - adjust URL/format as needed)
 */
async function parseWithLongCat(rawText, apiKey) {
  const prompt = buildPrompt(rawText);

  try {
    // Adjust this URL and format based on actual LongCat API documentation
    const response = await fetch('https://api.longcat.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'longcat-default',
        messages: [
          {
            role: 'system',
            content: 'You are a receipt parsing assistant. Extract structured data from receipt text and return ONLY valid JSON, no markdown, no explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('LongCat API error', { status: response.status, error: errorText });
      throw new Error(`LongCat API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in LongCat response');
    }

    return JSON.parse(content);
  } catch (error) {
    logger.error('Error parsing with LongCat', error);
    throw error;
  }
}

/**
 * Build deterministic prompt for receipt parsing
 */
function buildPrompt(rawText) {
  return `Parse the following receipt/invoice text and extract structured data.

RECEIPT TEXT:
${rawText}

INSTRUCTIONS:
1. Extract supplier name if present (field: supplier)
2. Extract all line items with:
   - name: product name (normalized, remove extra spaces)
   - qty: quantity as number
   - unit: unit type normalized to one of: "pcs", "kg", "g", "pack", "carton", "case", "liter", "l"
     - Convert: "g" -> "kg" (divide qty by 1000), "liter"/"l" -> "kg" if appropriate
     - Keep "pcs", "pack", "carton", "case" as-is
   - unitCost: price per unit (numeric, no currency symbols)
   - lineTotal: total for this line (numeric, optional if can calculate from qty * unitCost)

3. Clean all currency values: remove currency symbols, commas, convert to numbers
4. Return ONLY valid JSON in this exact format:
{
  "supplier": "supplier name or null",
  "items": [
    {
      "name": "product name",
      "qty": 10,
      "unit": "pcs",
      "unitCost": 25.50,
      "lineTotal": 255.00
    }
  ]
}

5. Do not include any markdown formatting, explanations, or additional text.
6. Return only the JSON object.`;
}

export { parseReceiptText };
