# 公開版本驗證

日期：2026-11-05（香港時間）。

- Python 3.14；Pillow 13.0.0；Playwright 1.64.1；Chromium。
- 水循環：6 個章節，1280 / 390 px 均為 `GREEN`，無測試失敗。
- 全圖解範例：9 種圖解，1280 / 390 px 均為 `GREEN`，無測試失敗。
- 檢查項目：頁面導航、按鈕及圖解互動、文字溢出、長文壓力測試、聲效及跨頁狀態。
- 目視檢查：示範頁面、手機圖解總覽、README 三張預覽圖片。
- 打包檢查：ZIP 包含 7 個 HTML 頁面及 LICENSE；README 的本機檔案連結均存在。
- 公開檔案不含本機絕對路徑；私人文章及其學習輸出未納入。

## 報告

- [水循環報告](test-report-water-cycle.json)
- [全部圖解報告](test-report-all-charts.json)

在倉庫根目錄重跑：

```bash
python scripts/build_site.py --journey src/journey.json --out out --strict
python test.py --site out --shots out-shots

python scripts/build_site.py --journey examples/all-charts.journey.json --out out-all --strict
python test.py --site out-all --shots out-all-shots
```

Safari、Firefox、真人使用測試及外部 AI 平台相容性不包含在上述結果內。建構工具最後只新增授權檔複製：已重建水循環 ZIP 並確認 LICENSE 存在；此項不改變頁面內容。
