# Formula AI Writer

Type the name of a formula, get ready-to-use LaTeX back. Supports both inline `$...$` and block `$$...$$` delimiters, and inserts straight at your cursor.

## Features

- **Natural language in, LaTeX out** — type "quadratic formula" or "贝叶斯定理", the model returns the LaTeX body.
- **Two delimiter forms**, switchable after generation:
  - inline `$...$` — flows inside a sentence
  - block `$$...$$` — standalone centered line
- **Insert at cursor** or **copy to clipboard**.
- **Convert selection** — select a formula name in your note, run the command, get the formula.
- Any OpenAI-compatible endpoint works: OpenAI, DeepSeek, Zhipu, Qwen, Ollama, etc.

## Installation

### Manual (recommended for first try)

1. Download `main.js`, `manifest.json`, `styles.css` from the latest [Release](../../releases).
2. Copy them into `<YourVault>/.obsidian/plugins/formula-ai-writer/`. Create the folder if it doesn't exist. On Windows the `.obsidian` folder is hidden — enable *Hidden items* in Explorer.
3. In Obsidian: **Settings → Community plugins → turn off Restricted mode → Refresh → enable Formula AI Writer**.

### From source

```bash
git clone https://github.com/lidaxiong-eng/obsidian-formula-ai-writer
cd obsidian-formula-ai-writer
npm install
npm run dev      # watch mode
npm run build    # production build
```

For development, symlink or copy the repo into your vault's `.obsidian/plugins/`, then reload Obsidian with `Ctrl+R`.

## Setup

Open **Settings → Formula AI Writer** and fill in three fields:

| Field | What to put |
|---|---|
| API Key | Your key, e.g. `sk-…` |
| Base URL | OpenAI-compatible endpoint up to `/v1`, e.g. `https://api.openai.com/v1` or `https://api.deepseek.com/v1` |
| Model | e.g. `gpt-4o-mini`, `deepseek-chat`, `qwen-plus`, `glm-4-flash` |

## Usage

1. Click the **Σ icon** in the left ribbon, or run **"打开 AI 公式生成器"** from the command palette.
2. Type the formula name, pick inline or block, click **生成**.
3. Toggle the form to rewrite the delimiters instantly, then **插入到光标处** or **复制**.

Useful commands:

- `打开 AI 公式生成器` — open the modal
- `把选中文字转成 LaTeX 公式` — turn selected text into a formula
- `生成块级公式（$$...$$）` — force block form

## Requirements

**TeX math must be enabled** for formulas to render: **Settings → Editor → toggle "TeX math" / "数学语法支持"**. If you see raw `$...$` text, this toggle is off.

## Privacy

This plugin sends the text you type in the input box to the third-party API endpoint you configure, together with your API key. The key is stored in plain text in `<vault>/.obsidian/plugins/formula-ai-writer/data.json` on your own machine. No other vault data is read or transmitted. If you use a local endpoint such as Ollama, nothing leaves your machine.

## License

MIT
