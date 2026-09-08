// js/ai/api-client.js
// Client for Gemini and OpenAI API requests with error management, timeouts, and cancellation.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CVApiClient = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let currentAbortController = null;

  function cancelPendingRequest() {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
  }

  async function callAI(prompt, config = {}) {
    cancelPendingRequest();
    currentAbortController = new AbortController();
    const { signal } = currentAbortController;

    const provider = config.provider || 'gemini';
    const apiKey = (config.key || '').trim();

    if (!apiKey) {
      throw new Error(`Please provide a valid API Key for ${provider.toUpperCase()} in the AI Config modal.`);
    }

    const timeoutId = setTimeout(() => {
      cancelPendingRequest();
    }, 20000);

    try {
      if (provider === 'gemini') {
        return await callGemini(prompt, apiKey, signal);
      } else if (provider === 'openai') {
        return await callOpenAI(prompt, apiKey, signal);
      } else {
        throw new Error(`Unsupported AI Provider: ${provider}`);
      }
    } finally {
      clearTimeout(timeoutId);
      currentAbortController = null;
    }
  }

  async function callGemini(prompt, apiKey, signal) {
    // Uses Google Gemini 1.5 Flash / 2.0 Flash endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024
        }
      }),
      signal
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg = errBody.error?.message || `Gemini API returned status ${response.status}`;
      throw new Error(`Gemini Error: ${msg}`);
    }

    const data = await response.json();
    const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textPart) {
      throw new Error('Gemini returned an empty response. Please try again.');
    }
    return textPart.trim();
  }

  async function callOpenAI(prompt, apiKey, signal) {
    const url = 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume editor and career coach.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1024
      }),
      signal
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg = errBody.error?.message || `OpenAI API returned status ${response.status}`;
      throw new Error(`OpenAI Error: ${msg}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response.');
    }
    return content.trim();
  }

  return {
    callAI,
    cancelPendingRequest
  };
});
