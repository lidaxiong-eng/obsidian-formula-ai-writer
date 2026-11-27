import { App, Modal, Notice, Setting, MarkdownView } from "obsidian";
import type FormulaAIPlugin from "./main";
import { wrap } from "./ai";
import type { FormulaFormat } from "./settings";

export class FormulaModal extends Modal {
  private query = "";
  private format: FormulaFormat;
  private busy = false;
  private lastResult = "";
  private resultEl!: HTMLElement;
  private generateBtn!: HTMLButtonElement;

  constructor(
    app: App,
    private plugin: FormulaAIPlugin,
    private preset = ""
  ) {
    super(app);
    this.format = plugin.settings.defaultFormat;
    this.query = preset;
    this.format =
      preset.length > 24 ? "block" : plugin.settings.defaultFormat;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("formula-ai-modal");

    new Setting(contentEl).setName("AI 公式生成").setHeading();

    new Setting(contentEl)
      .setName("公式名称")
      .setDesc("例如：二次方程求根公式 / 欧拉公式 / 贝叶斯定理 / 洛伦兹变换")
      .addText((t) => {
        t.setPlaceholder("输入公式的中文或英文名…")
          .setValue(this.query)
          .onChange((v) => (this.query = v));
        t.inputEl.addClass("formula-ai-input");
        t.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter" && !e.isComposing) void this.run();
        });
        window.setTimeout(() => t.inputEl.focus(), 30);
      });

    new Setting(contentEl).setName("插入形式").addDropdown((d) =>
      d
        .addOption("inline", "行内  $...$")
        .addOption("block", "块级  $$...$$")
        .setValue(this.format)
        .onChange((v) => {
          this.format = v as FormulaFormat;
          this.paint();
        })
    );

    new Setting(contentEl)
      .addButton((b) => {
        this.generateBtn = b
          .setButtonText("生成")
          .setCta()
          .onClick(() => void this.run()).buttonEl;
      })
      .addButton((b) =>
        b.setButtonText("插入到光标处").onClick(() => this.insert())
      )
      .addButton((b) => b.setButtonText("复制").onClick(() => void this.copy()))
      .addExtraButton((b) =>
        b.setIcon("cross").setTooltip("关闭").onClick(() => this.close())
      );

    new Setting(contentEl).setDesc(
      "生成后可切换「插入形式」实时改写包裹方式，再插入或复制。"
    );

    this.resultEl = contentEl.createDiv({
      cls: "formula-ai-result is-placeholder",
    });
    this.resultEl.setText("结果将显示在这里");
  }

  /** 供命令强制指定形式（在 open 之前调用） */
  setFormat(f: FormulaFormat): this {
    this.format = f;
    return this;
  }

  private async run(): Promise<void> {
    const q = this.query.trim();
    if (!q) { new Notice("请先输入公式名称"); return; }
    if (!this.plugin.settings.apiKey) {
      new Notice("请先在设置里填写 API Key");
      return;
    }

    this.busy = true;
    this.generateBtn.disabled = true;
    this.generateBtn.setText("生成中…");
    this.resultEl.removeClass("is-error", "is-placeholder");
    this.resultEl.setText("正在请求模型…");

    try {
      this.lastResult = await this.plugin.ai.generate(q, this.format);
      this.paint();
    } catch (e) {
      this.resultEl.addClass("is-error");
      this.resultEl.setText(`生成失败：${(e as Error).message}`);
    } finally {
      this.busy = false;
      this.generateBtn.disabled = false;
      this.generateBtn.setText("生成");
    }
  }

  private paint(): void {
    if (!this.lastResult) return;
    this.resultEl.removeClass("is-error", "is-placeholder");
    this.resultEl.empty();
    this.resultEl.createEl("code", { text: wrap(this.lastResult, this.format) });
    const tip = this.resultEl.createEl("span", { cls: "formula-ai-preview" });
    tip.setText(
      this.format === "inline"
        ? "行内形式：与正文同一行渲染"
        : "块级形式：独立居中成行，前后会自动留空行"
    );
  }

  private insert(): void {
    if (!this.lastResult) { new Notice("还没有结果，请先生成"); return; }
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) { new Notice("请先打开并聚焦一篇 Markdown 笔记"); return; }

    const raw = this.lastResult;
    const text =
      this.format === "inline" ? `$${raw}$` : `\n\n$$\n${raw}\n$$\n\n`;

    const editor = view.editor;
    editor.replaceRange(text, editor.getCursor());
    new Notice("已插入到光标处");
    this.close();
  }

  private async copy(): Promise<void> {
    if (!this.lastResult) { new Notice("还没有结果，请先生成"); return; }
    const text = wrap(this.lastResult, this.format);
    try {
      await navigator.clipboard.writeText(text);
      new Notice("已复制到剪贴板");
    } catch {
      this.resultEl.addClass("is-error");
      this.resultEl.setText("复制失败，请手动选中上方代码复制");
    }
  }

  onClose(): void {
    if (this.busy) new Notice("请求仍在进行，可在控制台查看结果");
    this.contentEl.empty();
    this.lastResult = "";
  }
}
