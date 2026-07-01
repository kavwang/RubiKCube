# Rubik Cube 魔術方塊教學解題器（2x2 / 3x3）

<!-- TODO: 加入 Demo 截圖或 GIF -->
<!-- ![Demo Screenshot](docs/demo-screenshot.png) -->

一款純前端的魔術方塊教學解題工具，直接在瀏覽器中即可使用，主要功能包含：

- 2x2 與 3x3 **LBL（Layer-by-Layer）分層解法教學**，附帶逐步動畫播放
- 2x2 **雙向搜尋最佳解**（雙向 BFS，God's Number ≤ 11 步），附帶逐步動畫播放
- 3x3 **Kociemba Two-Phase 速解**（自行開發的純 JavaScript 演算法，平均約 21 步），附帶逐步動畫播放
- 3D 互動視角（可拖曳旋轉，編輯與解題時會自動鎖定鏡頭避免誤觸）
- 點擊色票上色、輸入打亂公式、隨機打亂

本專案的核心理念是讓使用者不只「拿到答案」，更能「跟著步驟學會怎麼還原」；同時也可切換到速解模式，看看更有效率的還原步驟。

---

## 技術架構

| 技術 | 用途 |
|---|---|
| [Three.js](https://threejs.org/) v0.165.0 | 3D 魔術方塊的繪製與轉動動畫（透過 CDN Import Map 載入） |
| 自行開發 Kociemba 求解器 | 3x3 Kociemba Two-Phase 最速解演算法（純 JavaScript 從零實作） |
| ES Modules | 瀏覽器原生模組系統，不需要額外的打包工具 |
| Web Workers | 把解題運算放到背景執行緒，避免卡住使用者介面 (UI) |
| GitHub Actions | CI 自動執行測試 ＋ GitHub Pages 自動部署 |
| Node.js `node:test` | Node.js 內建測試框架，完全無第三方相依套件 |
| Vanilla CSS | 科技感深色主題，包含 iOS 風格的切換開關 |

---

## 功能總覽

### 首頁（模式選擇）
- 選擇進入 `2x2` 或 `3x3` 解題頁面
- 首頁提供自動旋轉的 3D 方塊預覽

### 2x2 模式
- 支援手動點選色票上色
- 支援隨機產生可解的打亂狀態
- 支援逐步教學播放與自動播放
- 支援 **LBL 分層解法** 與 **雙向搜尋最佳解**（能在極短時間內找出 God's Number，最多 11 步的最短還原路徑）
- **不合法角塊偵測與視覺提示**：若輸入的顏色導致角塊方向總和不合法（代表某顆角塊被手動扭轉過），系統會自動列出可疑的角塊，並在 3D 畫面上以橘色脈衝閃爍標示位置，幫助使用者快速找到輸入錯誤

### 3x3 模式
- 介面風格與 2x2 一致
- 支援打亂公式輸入與套用
- 支援 **LBL 分層解法**：
  1. 底層十字 (Cross)
  2. 底層角塊還原 (F2L 前置步驟)
  3. 中層邊塊還原
  4. 頂層方向 (OLL) 與位置 (PLL) 還原（依步驟分段顯示）
- 支援 **Kociemba Two-Phase 速解**：
  - 採用自行開發的 Kociemba 兩階段演算法，直接搜尋接近最佳解
  - 平均約 21 步即可還原任意打亂狀態
  - 步數遠少於 LBL 分層解法
- 可逐步播放、單步前進／後退、跳回打亂起點

---

## 專案結構

```text
RubiKCube/
├─ index.html                        # 首頁
├─ two-by-two.html                   # 2x2 頁面
├─ three-by-three.html               # 3x3 頁面
├─ home-page.js                      # 首頁互動邏輯
├─ home-page.css                     # 首頁樣式
├─ two-by-two.js                     # 2x2 進入點 (Entry point)
├─ three-by-three.js                 # 3x3 進入點 (Entry point)
├─ app-theme.css                     # 共用深色主題樣式（含 iOS 切換開關）
├─ three-by-three.css                # 3x3 頁面補充樣式
├─ start-local-server.bat            # 本機啟動指令碼（Windows CMD）
├─ start-local-server.ps1            # 本機啟動指令碼（PowerShell）
├─ getting-started-zh-tw.md          # 快速入門指南（繁體中文）
├─ LICENSE                           # Apache License 2.0
├─ package.json                      # NPM 腳本與測試指令定義
│
├─ .github/workflows/
│  └─ ci-deploy.yml                  # GitHub Actions CI ＋ Pages 部署
│
├─ src/
│  ├─ two-by-two/                    # 2x2 模組（Clean Architecture）
│  │  ├─ two-by-two-main.js          #   進入點主控
│  │  ├─ application/
│  │  │  ├─ two-by-two-app-controller.js   # 狀態與事件控制器
│  │  │  └─ two-by-two-solver.worker.js    # 解題用 Web Worker
│  │  ├─ config/
│  │  │  └─ two-by-two-constants.js        # 常數與設定
│  │  ├─ domain/
│  │  │  ├─ two-by-two-solver-service.js   # 求解器服務（整合 LBL 與速解）
│  │  │  ├─ two-by-two-lbl-solver.js       # LBL 分層解法
│  │  │  ├─ two-by-two-fastest-solver.js   # 雙向 BFS 最佳解
│  │  │  ├─ two-by-two-cube-state.js       # 方塊狀態管理
│  │  │  └─ two-by-two-moves.js            # 轉法定義與操作
│  │  └─ infrastructure/
│  │     └─ two-by-two-cube-view.js        # Three.js 3D 繪製
│  │
│  └─ three-by-three/                # 3x3 模組（Clean Architecture）
│     ├─ three-by-three-main.js      #   進入點主控
│     ├─ application/
│     │  ├─ three-by-three-app-controller.js  # 狀態與事件控制器
│     │  └─ three-by-three-solver.worker.js   # 解題用 Web Worker
│     ├─ domain/
│     │  ├─ three-by-three-constants.js    # 常數、目標索引、公式巨集
│     │  ├─ three-by-three-cube-engine.js  # 狀態轉換、轉法與解析
│     │  ├─ three-by-three-lbl-solver.js   # LBL 分層解法
│     │  ├─ three-by-three-fastest-solver.js # Kociemba 速解（呼叫自行開發的 solver）
│     │  └─ two-phase/                  # 自行開發的 Kociemba 求解器模組
│     │     ├─ cubie-cube.js            #   方塊表示法與移動
│     │     ├─ coordinates.js           #   座標編碼與解碼
│     │     ├─ move-tables.js           #   預先計算的移動表
│     │     ├─ pruning-tables.js        #   BFS 剪枝啟發函數表
│     │     ├─ solver.js                #   IDA* 搜尋演算法主體
│     │     └─ facelet-parser.js        #   54 面貼紙解析
│     └─ infrastructure/
│        └─ three-by-three-cube-view.js    # Three.js 3D 繪製與動畫
│
└─ tests/
   ├─ unit/
   │  └─ three-by-three-cube-engine.test.js
   └─ smoke/
      ├─ three-by-three-lbl-solver.smoke.test.js
      └─ two-by-two-solver.smoke.test.js
```

---

## 架構設計（Clean Architecture）

2x2 與 3x3 模組都採用一致的「三層式」分離架構：

### 應用層（Application Layer）
- 路徑：`src/<module>/application/`
- 職責：整合 UI 元件、事件處理、狀態流程、播放控制
- 不直接耦合演算法細節（透過 Domain API 呼叫）
- 包含 Web Worker 來進行非同步解題，不會卡住主畫面

### 領域層（Domain Layer）
- 路徑：`src/<module>/domain/`
- 職責：核心商業邏輯與解題演算法
- 純運算模組，不依賴 DOM 或繪圖框架
- 可以單獨撰寫單元測試

### 基礎設施層（Infrastructure Layer）
- 路徑：`src/<module>/infrastructure/`
- 職責：3D 繪製、轉動動畫、鏡頭控制與使用者互動（Three.js）

這樣的分層設計讓「修改演算法」和「修改畫面」可以各自獨立進行，大幅降低後續的維護成本。

---

## 啟動方式

> ⚠️ 請**不要直接雙擊開啟 HTML 檔**——因為 `file://` 通訊協定會被瀏覽器的安全性限制（CORS / ES Module）阻擋。

### Windows

方法一：雙擊 `start-local-server.bat`

方法二：在 `start-local-server.ps1` 上按右鍵，選「以 PowerShell 執行」

### macOS / Linux（或任何有安裝 Node.js 的環境）

```bash
npx -y serve .
```

### 替代方案（Python）

```bash
python -m http.server 5500
```

伺服器啟動後，請用瀏覽器開啟：

```text
http://127.0.0.1:5500/index.html
```

---

## 測試

本專案使用 Node.js 內建測試框架（`node:test`），完全無須安裝第三方相依套件。

### 前置需求
- Node.js 20 以上（建議使用最新 LTS 版本）

### 執行指令

```bash
npm run test          # 執行全部測試
npm run test:unit     # 只執行單元測試
npm run test:smoke    # 只執行冒煙測試
```

### 測試涵蓋範圍

#### 單元測試（Unit Test）
檔案：`tests/unit/three-by-three-cube-engine.test.js`, `tests/unit/two-phase-*.test.js`

- 轉法符號解析是否正確
- 不合法符號是否有正確攔截
- 順時針與逆時針轉動是否能互相抵消
- 打亂 → 反向打亂是否會回到還原狀態
- 隨機打亂是否有避免連續轉動同一面
- **Two-Phase 方塊特性測試**（旋轉運算、操作相消）
- **Two-Phase 六大座標系統測試**（Twist、Flip、UDSlice、CornerPerm、EdgePerm、UDSlicePerm 的 get/set 一致性）

#### 冒煙測試（Smoke Test）
##### 3x3 測試
檔案：`tests/smoke/three-by-three-lbl-solver.smoke.test.js`
- LBL 與速解各執行 50 輪隨機打亂的冒煙測試
- 驗證每一輪最終都能完美回到還原狀態
- 斷言速解在統計上的總步數比 LBL 少
- 驗證各階段 (Phase) 邊界與步數的一致性

##### 2x2 測試
檔案：`tests/smoke/two-by-two-solver.smoke.test.js`
- 2x2 LBL 與速解各執行 50 輪隨機打亂
- 驗證還原的正確性，並斷言速解的步數一定 ≤ LBL（符合 God's Number 最短路徑）

---

## CI / CD

本專案已整合 GitHub Actions（`.github/workflows/ci-deploy.yml`）：

- **CI**：每次 push 或發 PR 到 `main` 分支時，自動執行 `npm test`（Node.js 22 環境）
- **CD**：push 到 `main` 且測試全數通過後，自動部署到 GitHub Pages
- 會觸發的檔案範圍：`src/**`、`tests/**`、`*.html`、`*.css`、`*.js`、`package.json`

---

## 瀏覽器支援

本專案使用 ES Module Import Maps 與 Web Workers，支援以下瀏覽器版本：

| 瀏覽器 | 最低版本 |
|---|---|
| Chrome | 89+ |
| Edge | 89+ |
| Firefox | 108+ |
| Safari | 16.4+ |

---

## 命名與開發維護原則

1. `application` 層不放 Three.js 的底層細節
2. `infrastructure` 層不放解題演算法
3. `domain` 層盡量不操作 DOM
4. 新增演算法時，請先補上 `unit test` 或 `smoke test` 再合併程式碼
5. 檔案命名遵循「職責清楚」原則（例如 `three-by-three-lbl-solver.js`、`three-by-three-cube-view.js`）

---

## 已知限制

- 目前為純前端單機版，無提供後端資料儲存功能
- LBL 模式主打教學與可讀性（解題步數較多）；若想看高效率還原，請切換至速解模式

---

## 未來規劃（Roadmap）

1. ~~整合 CI（GitHub Actions）自動執行 `unit + smoke` 測試~~ ✅ 已完成
2. 補上 E2E 測試（Playwright）來驗證完整的 UI 操作流程
3. **相機辨識色塊**：透過裝置相機鏡頭即時辨識實體魔術方塊的顏色配置
4. **響應式介面 (RWD) 優化**：針對不同裝置尺寸（手機、平板、桌機）優化 3D 繪製區與操作面板的排版配置

---

## 授權條款

本專案採用 [Apache License 2.0](LICENSE) 授權。
