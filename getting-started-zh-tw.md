# 啟動方式（避免 CORS）

請不要直接雙擊 `index.html`（`file://` 會被瀏覽器安全機制擋住）。

改用以下任一方式：

1. 雙擊 `start-local-server.bat`
2. 或右鍵用 PowerShell 執行 `start-local-server.ps1`

啟動後會自動打開：

`http://127.0.0.1:5500/index.html`

若要停止伺服器，關閉該命令視窗即可。

## 測試（Smoke + Unit）

先確認已安裝 Node.js（建議 20+）。

可用下列指令：

- `npm run test`：執行全部測試
- `npm run test:unit`：只跑單元測試
- `npm run test:smoke`：只跑 smoke test（隨機打亂回歸）
