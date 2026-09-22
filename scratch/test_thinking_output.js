const path = require('path');
const FayzarOcrConfig = require('c:/Users/Admin/.gemini/antigravity-ide/scratch/fayzar-bangla-converter/js/fayzar-ocr-config.js');
const keys = FayzarOcrConfig.getAllSystemKeys(false);

async function testPrompt(model, thinkingBudget) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keys[1]}`;
  const payload = {
    contents: [{ parts: [{ text: "৭ম শ্রেণির বিজ্ঞান বিষয়ের ১ থেকে ১০ পর্যন্ত ১০টি বহুনির্বাচনী প্রশ্ন তৈরি কর।" }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 65536
    }
  };
  if (thinkingBudget !== undefined) {
    payload.generationConfig.thinkingConfig = { thinkingBudget };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log(`[${model}] (budget=${thinkingBudget}) Status:`, res.status);
    if (!res.ok) {
      console.log("Error:", JSON.stringify(data.error));
    } else {
      const candidate = data.candidates?.[0];
      console.log("Finish reason:", candidate?.finishReason);
      const text = candidate?.content?.parts?.[0]?.text || '';
      console.log("Output text length:", text.length);
      console.log("First 200 chars:\n", text.substring(0, 200));
      console.log("Last 200 chars:\n", text.slice(-200));
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

async function run() {
  await testPrompt('gemini-3.8-flash', 0);
  await testPrompt('gemini-3.8-flash', undefined);
}
run();
