// ───────── CONFIG ─────────
const API_KEY = "FROM GOOGLE DEVELOPER";
const MODEL   = "gemini-2.0-flash";
const ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// ───────── ELEMENTS ─────────
const questionEl = document.getElementById("question");
const answerEl   = document.getElementById("answer");
const submitBtn  = document.getElementById("submit");

// ───────── STATE ─────────
const history = [];

// ───────── CALL HELPER ─────────
async function callGemini(promptText) {
  const body = {
    contents: [
      { role: "user", parts: [{ text: promptText }] }
    ]
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(`API ${res.status}: ${err?.error?.message || res.statusText}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

// ───────── Q&A FLOW ─────────
async function askNextQuestion() {
  const promptText = history.map(m => `${m.role}: ${m.content}`).join("\n")
                   + "\nassistant:";
  const nextQ = await callGemini(promptText);
  history.push({ role: "assistant", content: nextQ });
  questionEl.textContent = nextQ;
}

async function getRecommendation() {
  const fullPrompt = history.map(m => `${m.role}: ${m.content}`).join("\n")
                   + "\nassistant: بناءً على الإجابات السابقة، أوصِ بأفضل هواية واحدة واشرح السبب.";
  const rec = await callGemini(fullPrompt);
  questionEl.textContent = rec;
  submitBtn.disabled = true;
}

submitBtn.addEventListener("click", async () => {
  const ans = answerEl.value.trim();
  if (!ans) return;
  history.push({ role: "user", content: ans });
  answerEl.value = "";

  const askedCount = history.filter(m => m.role === "assistant").length;
  if (askedCount >= 8) {
    await getRecommendation();
  } else {
    await askNextQuestion();
  }
});

// ───────── BOOTSTRAP ─────────
;(async function init() {
  history.push({
    role:    "system",
    content: "أنت بوت لاكتشاف الهوايات. اطرح سؤالاً واحداً في كل مرة باللغة العربية لاكتشاف أفضل هواية تجعل المستخدم سعيدًا."
  });
  await askNextQuestion();
})().catch(err => {
  console.error(err);
  questionEl.textContent = "خطأ: " + err.message;
});ص
