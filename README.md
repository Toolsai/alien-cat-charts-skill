<div align="center">

# 👽 Alien Cat Charts

**把文章變成可以邊玩邊學的互動圖解網站。**

給 AI Agent 使用的 Skill · 繁體中文 / English · 電腦 / 手機

[快速開始](#快速開始) · [下載示範](examples/water-cycle-site.zip) · [9 種圖解](#可以做甚麼) · [English](#english)

![Alien Cat Charts 封面](docs/preview/cover.png)

</div>

## 這是甚麼？

把網址、文章、文件或筆記交給 AI，讓它按原文順序整理重點，製作一個有**外星人、太空貓和互動圖表**的學習網站。

每站只講一個概念：讀幾句重點、操作圖解，再用小測驗檢查理解。適合把長文章拆成容易消化的小段，或製作教學、流程說明及複習材料。

這是一個**跟 AI Agent 一起玩的 Skill**。你提供內容，AI 幫你整理重點、製作圖解和檢查成果。

## 看看實際效果

水循環示範：6 站、6 種圖解。以下均為真實網站截圖。

![電腦版互動圖解](docs/preview/desktop.png)

![手機版預覽](docs/preview/mobile.png)

[下載水循環示範 ZIP](examples/water-cycle-site.zip)，解壓後開啟 `index.html` 即可體驗。

## 可以做甚麼？

| 圖解 | 適合內容 | 操作方式 |
| --- | --- | --- |
| 流程圖 | 步驟、判斷、分支 | 逐步播放、選擇路線 |
| 時間軸 | 歷史、發展、先後次序 | 沿時間線探索 |
| 漫畫 | 故事、對話、例子 | 逐格閱讀 |
| 循環圖 | 水循環、反覆發生的過程 | 點選階段、播放循環 |
| 小測驗 | 檢查理解 | 選答案、看解釋 |
| 對比卡 | A / B、前後差異 | 逐行揭開 |
| 熱點地圖 | 部件、位置、名詞探索 | 點選熱點看說明 |
| 任務清單 | 要求、待辦、學習確認 | 勾選並查看進度 |
| 翻翻卡 | 詞語、定義、複習 | 點擊翻面 |

另外附有 12 個角色、6 種太空背景、旅程目錄、逐頁導航，以及預設關閉的原創環境聲效。

## 快速開始

### 1. 請 AI 幫你安裝

把下面這段話貼給你的 AI Agent：

```text
請幫我安裝這個 Skill：
https://github.com/Toolsai/alien-cat-charts-skill

請閱讀倉庫的 SKILL.md，按照你使用的工具完成安裝，
完成後告訴我如何呼叫 alien-journey。
```

安裝完成後，按 AI 提供的方法開始使用。

### 2. 給 AI 一段內容

```text
$alien-journey

請把下面這篇文章做成繁體中文互動學習網站。
按原文順序分成 4–7 站，每站只講一個重點，最後加小測驗。

[貼上文章、網址或附上文件]
```

### 3. 開啟成果

AI 會交付網站資料夾、ZIP 及畫面預覽。解壓 ZIP，開啟 `index.html`。

- 下方按鈕：上一頁 / 目錄 / 下一頁。
- 鍵盤：`←` `→` 翻頁，`Home` 回目錄。
- 右上角「🔇 開啟宇宙聲效」：自行開啟聲音。

## 小提醒

- 一次提供一篇文章或一個主題，讓 AI 分成幾站，讀起來更輕鬆。
- 內容太多或看不明白？直接請 AI「再簡單一點」或「換成漫畫解釋」。
- AI 的摘要仍要核對；聲效預設關閉，想聽再自行開啟。

## 授權與來源

程式、角色圖片與合成環境音依 [MIT License](LICENSE) 提供，保留原有作者聲明。

**水循環示範文字另依 CC BY-SA 4.0 提供**，改寫自 Wikipedia 的〈Water cycle〉。轉用或修改示範內容時，請保留[來源與授權](examples/water-cycle.SOURCE.md)。預覽中的示範文字亦依此授權；預覽設計本身依 MIT 提供。

自己的文章、文件或外部圖片仍需遵守原有授權。本倉庫不包含使用者的私人文章或學習輸出。

## English

**Turn articles, notes and documents into playful, interactive learning journeys.**

Alien Cat Charts is an AI skill and static-site kit with 9 interactive chart types, 12 characters, 6 space backgrounds, page navigation and optional ambient audio. It supports Traditional Chinese and English, with desktop and mobile layouts.

Paste this into your AI agent:

```text
Please install this skill:
https://github.com/Toolsai/alien-cat-charts-skill

Read SKILL.md, follow your tool's skill installation method,
and tell me how to invoke alien-journey when it is ready.
```

Then give your agent an article, URL or document and ask for an interactive learning journey. Your agent handles the content, site creation and checks.

Try the [water-cycle demo](examples/water-cycle-site.zip): unzip and open `index.html`. Code and original assets are MIT licensed; the Wikipedia-derived demo text is CC BY-SA 4.0. See [LICENSE](LICENSE) and [source attribution](examples/water-cycle.SOURCE.md).
