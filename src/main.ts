import { Plugin, Notice } from "obsidian";
import { FormulaModal } from "./modal";
import { AIService } from "./ai";
import {
  FormulaSettingTab,
  DEFAULT_SETTINGS,
  type FormulaAISettings,
} from "./settings";

export default class FormulaAIPlugin extends Plugin {
  settings!: FormulaAISettings;
  ai!: AIService;

  async onload(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    ) as FormulaAISettings;
    this.ai = new AIService(this.settings);

    this.addRibbonIcon("sigma", "AI 公式生成", () => this.open());

    this.addCommand({
      id: "open-formula-modal",
      name: "打开 AI 公式生成器",
      editorCallback: () => this.open(),
    });

    this.addCommand({
      id: "formula-from-selection",
      name: "把选中文字转成 LaTeX 公式",
      editorCallback: (editor) => {
        const sel = editor.getSelection().trim();
        if (!sel) return new Notice("请先选中公式名称，再执行此命令");
        new FormulaModal(this.app, this, sel).open();
      },
    });

    this.addCommand({
      id: "insert-formula-block",
      name: "生成块级公式（$$...$$）",
      editorCallback: () => this.open("block"),
    });

    this.addSettingTab(new FormulaSettingTab(this.app, this));
  }

  private open(force?: "inline" | "block"): void {
    if (!this.settings.apiKey) {
      new Notice("Formula AI Writer：请先在设置里填写 API Key");
    }
    const modal = new FormulaModal(this.app, this);
    if (force) modal.setFormat(force);
    modal.open();
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.ai = new AIService(this.settings);
  }

  onunload(): void {
    /* 无需额外清理 */
  }
}
