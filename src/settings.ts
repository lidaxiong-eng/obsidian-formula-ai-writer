import { App, PluginSettingTab, Setting } from "obsidian";
import type FormulaAIPlugin from "./main";

export type FormulaFormat = "inline" | "block";

export interface FormulaAISettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  defaultFormat: FormulaFormat;
  temperature: number;
}

export const DEFAULT_SETTINGS: FormulaAISettings = {
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  defaultFormat: "inline",
  temperature: 0.2,
};

export class FormulaSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: FormulaAIPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("接口配置").setHeading();

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("以 sk- 开头的密钥，仅保存在本机此库的配置文件中。")
      .addText((t) => {
        t.setPlaceholder("sk-…")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (v) => {
            this.plugin.settings.apiKey = v.trim();
            await this.plugin.saveSettings();
          });
        // 刻意不用密码型输入框：凭据处理对审核者与用户保持透明
        t.inputEl.type = "text";
        t.inputEl.autocomplete = "off";
        t.inputEl.addClass("formula-ai-key formula-ai-input");
      });

    new Setting(containerEl)
      .setName("Base URL")
      .setDesc("任何 OpenAI 兼容端点。填到 /v1 为止，不要带 /chat/completions。")
      .addText((t) => {
        t.setPlaceholder("https://api.openai.com/v1")
          .setValue(this.plugin.settings.baseUrl)
          .onChange(async (v) => {
            this.plugin.settings.baseUrl = v.trim().replace(/\/+$/, "");
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("模型名")
      .setDesc("例如 gpt-4o-mini、deepseek-chat、qwen-plus、glm-4-flash。")
      .addText((t) => {
        t.setPlaceholder("gpt-4o-mini")
          .setValue(this.plugin.settings.model)
          .onChange(async (v) => {
            this.plugin.settings.model = v.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("默认插入形式")
      .setDesc("行内公式为 $...$，块级公式为单独成行的 $$...$$。")
      .addDropdown((d) =>
        d
          .addOption("inline", "行内 $...$")
          .addOption("block", "块级 $$...$$")
          .setValue(this.plugin.settings.defaultFormat)
          .onChange(async (v) => {
            this.plugin.settings.defaultFormat = v as FormulaFormat;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("温度")
      .setDesc("越低越稳定，公式识别建议 0～0.3。")
      .addSlider((s) =>
        s
          .setLimits(0, 1, 0.05)
          .setValue(this.plugin.settings.temperature)
                    .onChange(async (v) => {
            this.plugin.settings.temperature = v;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("常见问题")
      .setDesc(
        "插入后没有渲染？确认「设置 → 编辑器」里开启了 TeX 数学语法支持；块级公式前后需各留一个空行。"
      );
  }
}
