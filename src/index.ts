import type { Ai } from "@cloudflare/ai"

export interface Env {
  AI: Ai
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // 🏠 Serve HTML UI
    if (request.method === "GET" && url.pathname === "/") {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Doc Summarizer</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #faf9f7, #f5f3f0);
      color: #2d2420;
      margin: 0;
      padding: 40px 20px;
    }
    h1 {
      text-align: center;
      font-size: 2.2rem;
      color: #3e3935;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    textarea {
      width: 100%;
      height: 200px;
      padding: 16px;
      font-size: 1rem;
      border-radius: 10px;
      border: 1px solid #d4cfc7;
      margin-top: 16px;
      background: #fefdfb;
      color: #2d2420;
    }
    textarea:focus {
      outline: none;
      border-color: #8b7d6b;
      box-shadow: 0 0 0 3px rgba(139, 125, 107, 0.1);
    }
    .buttons {
      display: flex;
      gap: 12px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    button {
      flex: 1;
      min-width: 140px;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: #8b7d6b;
      color: #faf9f7;
    }
    .btn-primary:hover {
      background: #6b6055;
    }
    .btn-secondary {
      background: #f5f3f0;
      border: 1px solid #8b7d6b;
      color: #8b7d6b;
    }
    .btn-secondary:hover {
      background: #ede9e3;
    }
    #result {
      margin-top: 32px;
      padding: 20px;
      background: #fefdfb;
      border-radius: 10px;
      border: 1px solid #d4cfc7;
      display: none;
    }
    #result.show {
      display: block;
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .spinner {
      border: 3px solid #d4cfc7;
      border-top: 3px solid #8b7d6b;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .error {
      color: #8b4513;
      background: #fdf4e6;
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid #8b4513;
    }
    .file-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      font-size: 0.9rem;
      color: #6b6055;
    }
    .file-row input[type="file"] {
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📄 Doc Summarizer</h1>
    <textarea id="textInput" placeholder="Paste your document here..."></textarea>

    <div class="buttons">
      <button class="btn-primary" onclick="summarizeText()">Summarize Text</button>
      <button class="btn-secondary" onclick="clearText()">Clear</button>
    </div>

    <div class="file-row">
      <input id="fileInput" type="file" accept=".txt" />
      <button class="btn-secondary" style="flex:0 0 auto" onclick="summarizeFile()">Summarize File</button>
      <span id="fileName"></span>
    </div>

    <div id="result"></div>
  </div>

  <script>
    function showResult(content) {
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = content;
      resultDiv.classList.add('show');
    }

    async function callSummarizeAPI(text) {
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = '<div class="spinner"></div>';
      resultDiv.classList.add('show');

      try {
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });

        const data = await response.json();
        if (data.error) {
          showResult('<div class="error"><strong>Error:</strong> ' + data.error + '</div>');
        } else {
          showResult('<h2>Summary</h2><p>' + data.summary + '</p>');
        }
      } catch (error) {
        showResult('<div class="error"><strong>Error:</strong> Failed to summarize</div>');
      }
    }

    async function summarizeText() {
      const text = document.getElementById('textInput').value.trim();
      if (!text) {
        alert('Please enter some text to summarize');
        return;
      }
      await callSummarizeAPI(text);
    }

    async function summarizeFile() {
      const fileInput = document.getElementById('fileInput');
      const fileNameSpan = document.getElementById('fileName');
      const file = fileInput.files[0];

      if (!file) {
        alert('Please choose a .txt file first');
        return;
      }

      fileNameSpan.textContent = file.name;

      const text = await file.text();
      document.getElementById('textInput').value = text;
      await callSummarizeAPI(text);
    }

    function clearText() {
      document.getElementById('textInput').value = '';
      const resultDiv = document.getElementById('result');
      resultDiv.classList.remove('show');
      resultDiv.innerHTML = '';
      document.getElementById('fileInput').value = '';
      document.getElementById('fileName').textContent = '';
    }

    document.getElementById('textInput').addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'Enter') {
        summarizeText();
      }
    });
  </script>
</body>
</html>
      `
      return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      })
    }

    // 🤖 Handle POST requests for summarization (JSON { text })
    if (request.method === "POST" && url.pathname === "/") {
      try {
        const body = await request.json()
        const text = (body as any)?.text?.toString().trim() || ""

        if (!text) {
          return new Response(JSON.stringify({ error: "No text provided" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        const maxLength = 4000
        const trimmedText = text.length > maxLength ? text.slice(0, maxLength) : text

        const prompt = `
	You are DocSummarizer, an advanced document summarization AI.

	Your task:
	- Read the text below carefully.
	- Write a clear, coherent summary in natural paragraph form.
	- Use complete sentences and smooth transitions between ideas.
	- Focus on the main points, key arguments, and conclusions.
	- Avoid lists, bullet points, or symbols such as "*" or "-".
	- Maintain a professional yet accessible tone.
	- Keep the formatting clean with proper line spacing for readability.

	Text to summarize:
	${trimmedText}

	Return only the summary — no headings or extra commentary.
	`


        const { Ai } = await import("@cloudflare/ai")
        const ai = new Ai(env.AI)

        const response = await ai.run("@cf/meta/llama-3.1-8b-instruct" as any, { prompt })

        const summaryText =
          typeof response === "string"
            ? response
            : (response as any).response || JSON.stringify(response)

        return new Response(JSON.stringify({ summary: summaryText }), {
          headers: { "Content-Type": "application/json" },
        })
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    return new Response("Not Found", { status: 404 })
  },
}
