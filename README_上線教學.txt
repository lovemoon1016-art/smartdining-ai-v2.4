AI友膳 V2.4 真AI競賽版｜部署教學

這次不是單純HTML：真正AI需要Netlify Functions後端，請用GitHub連動Netlify部署，不能只用Netlify Drop拖曳ZIP期待後端自動運作。

1. 建立GitHub儲存庫（建議Private），把index.html、netlify.toml和netlify/functions/analyze.mjs上傳，保持資料夾結構。
2. Netlify -> Add new project -> Import an existing project -> GitHub -> 選擇該儲存庫。
3. Build command留空，Publish directory填「.」，Functions directory為netlify/functions（netlify.toml已設定）。
4. 在Netlify專案設定 Environment variables 新增 OPENAI_API_KEY，值為你自己的OpenAI API金鑰。不要把金鑰貼在HTML、GitHub、LINE或對話中。
5. 在Environment variables可選擇新增 OPENAI_MODEL（預設gpt-4o-mini）。
6. 設定後重新Deploy，開啟 .netlify.app 網址，按「真正AI分析」。
7. 如果出現錯誤，查看Netlify Functions的執行紀錄。OpenAI API需獨立計費，和ChatGPT訂閱不同。

安全與測試：本專案為小型競賽展示，沒有帳號、限流及防濫用機制。不要無限制公開；請設定API用量預算，展示期間控制分享範圍。勿輸入真實敏感個資。示範菜單與餐廳服務均為虛構。未實際使用API金鑰測試成功前，不可宣稱真AI已驗證。
