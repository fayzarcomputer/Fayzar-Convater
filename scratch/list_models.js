const path = require('path');
const FayzarOcrConfig = require('c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js/fayzar-ocr-config.js');
const keys = FayzarOcrConfig.getAllSystemKeys(false);

async function listModels() {
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (res.ok) {
        const data = await res.json();
        const flashModels = data.models
          .filter(m => m.name.includes('flash') || m.name.includes('pro'))
          .map(m => ({
            name: m.name.replace('models/', ''),
            inputTokenLimit: m.inputTokenLimit,
            outputTokenLimit: m.outputTokenLimit,
            supportedGenerationMethods: m.supportedGenerationMethods
          }));
        console.log(`Key ${i} available models:`);
        console.log(flashModels);
        return;
      }
    } catch (e) {}
  }
}
listModels();
