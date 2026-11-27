import { requestUrl } from "obsidian";
import type { FormulaAISettings, FormulaFormat } from "./settings";

const SYSTEM_PROMPT = `你是 LaTeX 公式专家，服务于 Obsidian 笔记用户。
用户会给出一个公式的名称或一句自然语言描述，你只返回该公式的 LaTeX 主体代码。

严格规则：
1. 不要输出 $ 或 $$ 定界符；
2. 不要输出任何解释、注释、前后缀文字；
3. 不要用 markdown 代码块包裹；
4. 输出必须单行，需要换行的地方用空格代替；
5. 使用 Obsidian(MathJax) 可解析的语法：\\frac{}{}、\\int_{a}^{b}、\\sum_{i=1}^{n}、\\boldsymbol{}、\\mathrm{}、\\begin{cases}…\\end{cases}；
6. 不要使用 \\newcommand、\\def 等自定义命令，也不要用 amsmath 之外的冷门宏包语法；
7. 若用户描述有歧义，给出最常见、最标准的那个形式。`;

export class AIService {
  constructor(private settings: FormulaAISettings) {}

  async generate(query: string, format: FormulaFormat): Promise<string> {
    const s = this.settings;

    if (!s.apiKey) throw new Error("未填写 API Key");

    const userMsg =
      format === "block"
        ? `请给出这个公式的 LaTeX 主体（适合独立成行的多行展示）：${query}`
        : `请给出这个公式的 LaTeX 主体（适合行内嵌入的紧凑单行形式）：${query}`;

    const res = await requestUrl({
      url: `${s.baseUrl}/chat/completions`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${s.apiKey}`,
      },
      body: JSON.stringify({
        model: s.model,
        temperature: s.temperature,
        stream: false,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
      }),
      throw: false,
    });

    if (res.status !== 200) {
      let detail = res.text ?? "";
      try {
        const j = res.json as { error?: { message?: string } } | null;
        if (j?.error?.message) detail = j.error.message;
      } catch {
        /* 忽略解析失败，回退到原始文本 */
      }
      // 只回显状态码与一行简短原因，不透传上游响应体（可能含账户信息或回显的密钥）
      const safe = detail.replace(/sk-[A-Za-z0-9_-]{6,}/g, "sk-***").slice(0, 120);
      throw new Error(`请求失败（${res.status}）${safe ? "：" + safe : "，请检查 Base URL、模型名与 API Key"}`);
    }

    const text =
      (res.json as { choices?: Array<{ message?: { content?: string } }> } | null)
        ?.choices?.[0]?.message?.content ?? "";

    const cleaned = this.clean(text);
    if (!cleaned) throw new Error("模型返回了空内容，换个说法再试一次");
    return cleaned;
  }

  /** 剥掉模型自作主张加的定界符、代码块、解释文字 */
  private clean(t: string): string {
    let s = (t ?? "").trim();

    // 去掉 ```latex ... ``` 包裹
    const fence = s.match(/^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/);
    if (fence) s = fence[1].trim();

    // 去掉成对定界符
    s = s.replace(/^\$\$([\s\S]*)\$\$$/, "$1").replace(/^\$([\s\S]*)\$$/, "$1");

    // 去掉行首可能残留的解释句（取第一个含反斜杠或等号的行段）
    const lines = s.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      const picked = lines.find((l) => /[\\=^{}_]/.test(l));
      if (picked) s = picked;
    }

    return s.replace(/\s+/g, " ").replace(/\$\$/g, "").trim();
  }
}

/** 按形式包裹定界符 */
export function wrap(raw: string, format: FormulaFormat): string {
  return format === "inline" ? `$${raw}$` : `$$\n${raw}\n$$`;
}
