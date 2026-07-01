# Rubik Cube 魔術方塊教學解題器（2x2 / 3x3）

<!-- TODO: 加入 Demo 截圖或 GIF -->
<!-- ![Demo Screenshot](docs/demo-screenshot.png) -->

一款純前端的魔術方塊教學解題工具，直接在瀏覽器中即可使用，主要功能包含：

- 2x2 與 3x3 **LBL（Layer-by-Layer）分層解法教學**，附帶逐步動畫播放
- 2x2 **雙向搜尋最佳解**（雙向 BFS，God's Number ≤ 11 步），附帶逐步動畫播放
- 3x3 **Kociemba Two-Phase 速解**（自行開發的純 JavaScript 演算法，平均約 21 步），附帶逐步動畫播放
- 3D 互動視角（可拖曳旋轉，編輯與解題時會自動鎖定鏡頭避免誤觸）
- 點擊色票上色、輸入打亂公式、隨機打亂
- **(NEW)** Apple 風格的 Light / Dark 亮暗色主題自動切換
- **(NEW)** 支援 i18n 多國語系介面

本專案的核心理念是讓使用者不只「拿到答案」，更能「跟著步驟學會怎麼還原」；同時也可切換到速解模式，看看更有效率的還原步驟。

---

## 技術架構

專案已全面升級，導入了現代化前端建置工具與樣式框架：

| 技術 | 用途 |
|---|---|
| **Vite** | 極速的模組打包與開發伺服器 (Dev Server) |
| **TailwindCSS v4** | 樣式框架，搭配自訂的 Apple 風格 Light / Dark 亮暗色主題 |
| **Three.js** v0.185.0 | 3D 魔術方塊的繪製與轉動動畫 |
| **自行開發 Kociemba 求解器** | 3x3 Kociemba Two-Phase 最速解演算法（純 JavaScript 從零實作） |
| **Web Workers** | 把解題運算放到背景執行緒，避免卡住使用者介面 (UI) |
| **Node.js `node:test`** | 內建測試框架，無需額外安裝 Jest/Mocha 等第三方測試套件 |
| **GitHub Actions** | CI 自動執行測試 ＋ GitHub Pages 自動打包與部署 |

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
├─ home-page.js                      # 首頁進入點 (Entry point)
├─ two-by-two.js                     # 2x2 進入點 (Entry point)
├─ three-by-three.js                 # 3x3 進入點 (Entry point)
├─ vite.config.js                    # Vite 打包工具設定檔
├─ package.json                      # NPM 腳本與相依套件定義
├─ getting-started-zh-tw.md          # 快速入門指南（繁體中文）
├─ LICENSE                           # Apache License 2.0
│
├─ .github/workflows/
│  └─ ci-deploy.yml                  # GitHub Actions CI ＋ Pages 部署
│
├─ src/
│  ├─ i18n/                          # 多語系文案設定
│  ├─ shared/                        # 共用的 UI 元件與基礎模組
│  ├─ styles/                        # TailwindCSS 全域樣式與主題設定
│  ├─ two-by-two/                    # 2x2 模組（Clean Architecture）
│  │  ├─ application/                #   狀態與事件控制器、Web Worker
│  │  ├─ domain/                     #   LBL / 速解邏輯、方塊狀態管理
│  │  └─ infrastructure/             #   Three.js 3D 繪製
│  │
│  └─ three-by-three/                # 3x3 模組（Clean Architecture）
│     ├─ application/                #   狀態與事件控制器、Web Worker
│     ├─ domain/                     #   LBL 解法、方塊狀態管理
│     │  └─ two-phase/               #   自行開發的 Kociemba 求解器模組
│     │     ├─ cubie-cube.js         #     方塊表示法與移動
│     │     ├─ coordinates.js        #     座標編碼與解碼
│     │     ├─ move-tables.js        #     預先計算的移動表
│     │     ├─ pruning-tables.js     #     BFS 剪枝啟發函數表
│     │     ├─ solver.js             #     IDA* 搜尋演算法主體
│     │     └─ facelet-parser.js     #     54 面貼紙解析
│     └─ infrastructure/             #   Three.js 3D 繪製與動畫
│
└─ tests/
   ├─ unit/                          # 單元測試 (Cube Engine, Two-Phase)
   └─ smoke/                         # 冒煙測試 (LBL 與最速解還原驗證)
```

---

## 架構設計（Clean Architecture）

2x2 與 3x3 模組都採用一致的「三層式」分離架構：

### 應用層（Application Layer）
- 職責：整合 UI 元件、事件處理、狀態流程、播放控制
- 不直接耦合演算法細節（透過 Domain API 呼叫）
- 包含 Web Worker 來進行非同步解題，不會卡住主畫面

### 領域層（Domain Layer）
- 職責：核心商業邏輯與解題演算法
- 純運算模組，不依賴 DOM 或繪圖框架
- 可以單獨撰寫單元測試

### 基礎設施層（Infrastructure Layer）
- 職責：3D 繪製、轉動動畫、鏡頭控制與使用者互動（Three.js）

這樣的分層設計讓「修改演算法」和「修改畫面」可以各自獨立進行，大幅降低後續的維護成本。

---

## 開發與啟動方式

專案已全面遷移至 Vite，請先確保系統已安裝 [Node.js](https://nodejs.org/) (建議使用 v20+ LTS 版)。

```bash
# 1. 安裝相依套件
npm install

# 2. 啟動開發伺服器
npm run dev

# 3. 建立正式發布版本 (會輸出至 dist/ 目錄)
npm run build
```

啟動 `npm run dev` 後，依照終端機提示的網址（通常為 `http://localhost:5173/`），在瀏覽器開啟即可。

---

## 測試

本專案使用 Node.js 內建測試框架（`node:test`）。

### 執行指令

```bash
npm run test          # 執行全部測試
npm run test:unit     # 只執行單元測試
npm run test:smoke    # 只執行冒煙測試
```

### 測試涵蓋範圍

#### 單元測試（Unit Test）
- 轉法符號解析是否正確
- 不合法符號是否有正確攔截
- 順時針與逆時針轉動是否能互相抵消
- **Two-Phase 方塊特性測試**（旋轉運算、操作相消）
- **Two-Phase 六大座標系統測試**（Twist、Flip、UDSlice、CornerPerm、EdgePerm、UDSlicePerm 的一致性）

#### 冒煙測試（Smoke Test）
- 針對 2x2 與 3x3 的 LBL 與速解，各執行 50 輪隨機打亂測試
- 驗證每一輪最終都能完美回到還原狀態
- 斷言速解在統計上的總步數比 LBL 少（或 ≤ 最佳步數）
- 驗證各階段 (Phase) 邊界與步數的一致性

---

## CI / CD

本專案已整合 GitHub Actions（`.github/workflows/ci-deploy.yml`）：

- **CI**：每次 push 或發 PR 到 `main` 分支時，自動執行 `npm test`（Node.js 22 環境）
- **CD**：push 到 `main` 且測試全數通過後，會透過 Vite 打包 (`npm run build`) 並自動部署到 GitHub Pages

---

## 瀏覽器支援

支援主流現代瀏覽器（需支援 ES Modules 與 Web Workers）：

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

---

## 已知限制

- 目前為純前端單機版，無提供後端資料儲存功能
- LBL 模式主打教學與可讀性（解題步數較多）；若想看高效率還原，請切換至速解模式

---

## 未來規劃（Roadmap）

1. ~~整合 CI（GitHub Actions）自動執行 `unit + smoke` 測試~~ ✅ 已完成
2. 補上 E2E 測試（Playwright）來驗證完整的 UI 操作流程
3. **相機辨識色塊**：透過裝置相機鏡頭即時辨識實體魔術方塊的顏色配置

---

## 授權條款

本專案採用 [Apache License 2.0](LICENSE) 授權。
