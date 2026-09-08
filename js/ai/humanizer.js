// js/ai/humanizer.js
// Unified Humanizer service coordinating Local linguistic engine and Cloud LLM providers.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./prompts.js'),
      require('./local-engine.js'),
      require('./api-client.js'),
      require('../storage.js')
    );
  } else {
    root.CVHumanizer = factory(
      root.CVPrompts,
      root.CVLocalAI,
      root.CVApiClient,
      root.CVStorage
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Prompts, LocalAI, ApiClient, Storage) {
  'use strict';

  async function humanize(text, options = {}) {
    const rawText = (text || '').trim();
    if (!rawText) {
      throw new Error('Please enter or select some text to humanize.');
    }

    const mode = options.mode || 'professional';
    const customInstruction = options.customInstruction || '';
    const apiConfig = Storage.getApiKeys();
    const provider = apiConfig.provider || 'local';

    let improvedText = '';
    let usedProvider = provider;

    if (provider === 'local') {
      // Offline high-performance linguistic engine
      improvedText = LocalAI.polishText(rawText, mode);
    } else {
      // Cloud API provider (Gemini or OpenAI)
      const apiKey = provider === 'gemini' ? apiConfig.geminiKey : apiConfig.openaiKey;

      if (!apiKey || !apiKey.trim()) {
        console.warn(`${provider} API key not found, falling back to Smart Local Engine.`);
        improvedText = LocalAI.polishText(rawText, mode);
        usedProvider = 'local (fallback - missing key)';
      } else {
        try {
          const prompt = Prompts.buildHumanizerPrompt(rawText, mode, customInstruction);
          improvedText = await ApiClient.callAI(prompt, {
            provider: provider,
            key: apiKey
          });
        } catch (err) {
          console.warn(`API call failed (${err.message}), falling back to Smart Local Engine.`);
          improvedText = LocalAI.polishText(rawText, mode);
          usedProvider = 'local (fallback - API error)';
        }
      }
    }

    // Calculate visual word diff
    const { origHtml, imprHtml } = LocalAI.computeWordDiff(rawText, improvedText);

    return {
      original: rawText,
      suggested: improvedText,
      mode: mode,
      provider: usedProvider,
      origDiff: origHtml,
      imprDiff: imprHtml
    };
  }

  function cancel() {
    ApiClient.cancelPendingRequest();
  }

  return {
    humanize,
    cancel
  };
});
