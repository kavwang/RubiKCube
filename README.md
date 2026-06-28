# Rubik Cube 教學解題器（2x2 / 3x3）

<!-- TODO: 加入 Demo 截圖或 GIF -->
<!-- ![Demo Screenshot](docs/demo-screenshot.png) -->

這是一個以瀏覽器執行的魔術方塊教學解題專案，提供：

- 2x2 與 3x3 LBL（Layer-by-Layer）分層解題與逐步播放
- 2x2 與 3x3 雙向尋優最速解（Fastest Solve）與逐步播放
- 3D 互動視角（可旋轉，具備防止編輯與解題時自動旋轉的穩定鎖定）
- 顏色編輯、打亂公式輸入、隨機打亂

專案目標是讓使用者不只「得到答案」，而是能「跟著步驟學會怎麼還原」，同時可切換至最速解模式查看更有效率的復原路徑。

---

## 技術棧

| 技術 | 用途 |
|---|---|
| [Three.js](https://threejs.org/) v0.165.0 | 3D 魔術方塊渲染與動畫（透過 CDN Import Map 引入） |
| ES Modules | 原生瀏覽器模組系統，無需打包工具 |
| Web Workers | 將求解運算移至背景執行緒，避免阻塞 UI |
| Node.js `node:test` | 內建測試框架，零外部依賴 |
| Vanilla CSS | 科技感暗色系主題，包含 iOS 風格 Toggle |

---

## 功能總覽

### 首頁（模式選擇）
- 可選擇進入 `2x2` 或 `3x3`
- 提供自動旋轉的 3D 視覺預覽

### 2x2 模式
- 支援手動上色
- 支援隨機可解打亂
- 支援逐步教學與自動播放
- 支援 **LBL 分層解法** 與 **雙向尋優最速解**（可在一瞬間以 God's Number 找出最多 11 步的最短解）
- **非法角塊偵測與視覺標記**：若輸入顏色後發現角塊方向總和不合法（代表某個角塊被手動扭轉），系統會自動列出嫌疑角塊，並在 3D 視圖中以橘色脈衝閃爍標記位置，協助使用者快速定位輸入錯誤

### 3x3 模式
- UI/UX 與 2x2 統一
- 支援打亂公式輸入與套用
- 支援 **LBL 分層解法**：
  1. 第一層十字
  2. 第一層角塊
  3. 第二層稜塊
  4. 第三層定向/置換（依步驟分段顯示）
- 支援 **雙向尋優與巨集混合最速解**：
  - 十字階段：藉由邊塊狀態映射子空間（190,080 狀態）進行雙向 BFS 尋優
  - 頂層階段：拆分為 OLL（定向）與 PLL（置換）兩個 BFS 巨集搜尋階段，避免狀態空間爆炸並尋求最少旋轉步數
  - 整體平均步數較 LBL 節省 ~18% 的旋轉步數，且生成解答僅需 ~290ms
- 可逐步播放、單步前進、回到打亂起點

---

## 專案結構

```text
RubiKCube/
├─ index.html                        # 首頁
├─ two-by-two.html                   # 2x2 頁面
├─ three-by-three.html               # 3x3 頁面
├─ home-page.js                      # 首頁互動邏輯
├─ home-page.css                     # 首頁樣式
├─ two-by-two.js                     # 2x2 入口頁面綁定
├─ three-by-three.js                 # 3x3 入口頁面綁定
├─ app-theme.css                     # 共用科技感暗色系樣式（含 iOS Toggle）
├─ three-by-three.css                # 3x3 頁面補充樣式
├─ start-local-server.bat            # 本機啟動（Windows CMD）
├─ start-local-server.ps1            # 本機啟動（PowerShell）
├─ getting-started-zh-tw.md          # 快速入門指南（繁體中文）
├─ LICENSE                           # Apache License 2.0
├─ package.json                      # 測試 scripts 定義
│
├─ src/
│  ├─ two-by-two/                    # 2x2 模組（Clean Architecture）
│  │  ├─ two-by-two-main.js          #   入口主控
│  │  ├─ application/
│  │  │  ├─ two-by-two-app-controller.js   # 狀態與事件控制器
│  │  │  └─ two-by-two-solver.worker.js    # 求解 Web Worker
│  │  ├─ config/
│  │  │  └─ two-by-two-constants.js        # 常數與配置
│  │  ├─ domain/
│  │  │  ├─ two-by-two-solver-service.js   # LBL 與雙向 BFS 求解器
│  │  │  ├─ two-by-two-cube-state.js       # 方塊狀態管理
│  │  │  └─ two-by-two-moves.js            # 轉法定義與操作
│  │  └─ infrastructure/
│  │     └─ two-by-two-cube-view.js        # Three.js 3D 渲染
│  │
│  └─ three-by-three/                # 3x3 模組（Clean Architecture）
│     ├─ three-by-three-main.js      #   入口主控
│     ├─ application/
│     │  ├─ three-by-three-app-controller.js  # 狀態與事件控制器
│     │  └─ three-by-three-solver.worker.js   # 求解 Web Worker
│     ├─ domain/
│     │  ├─ three-by-three-constants.js    # 常數、目標索引、公式宏
│     │  ├─ three-by-three-cube-engine.js  # 狀態轉換、轉法與解析
│     │  └─ three-by-three-lbl-solver.js   # LBL 與雙階段最速解求解器
│     └─ infrastructure/
│        └─ three-by-three-cube-view.js    # Three.js 3D 渲染與動畫
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

2x2 與 3x3 模組均採用一致的三層分離架構：

### Application Layer
- 位置：`src/<module>/application/`
- 責任：整合 UI 元件、事件、狀態流、播放流程
- 不直接耦合演算法細節（透過 Domain API 呼叫）
- 包含 Web Worker 進行非阻塞求解

### Domain Layer
- 位置：`src/<module>/domain/`
- 責任：核心規則與解題邏輯
- 純運算模組，不依賴 DOM 或渲染框架
- 可獨立進行單元測試

### Infrastructure Layer
- 位置：`src/<module>/infrastructure/`
- 責任：3D 呈現、動畫、鏡頭與互動（Three.js）

這樣的分層讓「演算法修改」與「畫面修改」能分開進行，維護成本明顯下降。

---

## 啟動方式

> ⚠️ 請**不要直接雙擊 HTML**——`file://` 協議會被瀏覽器安全限制（CORS / ES Module）擋住。

### Windows

方式一：雙擊 `start-local-server.bat`

方式二：右鍵用 PowerShell 執行 `start-local-server.ps1`

### macOS / Linux（或任何有 Node.js 的環境）

```bash
npx -y serve .
```

### 通用替代方案（Python）

```bash
python -m http.server 5500
```

啟動後使用瀏覽器開啟：

```text
http://127.0.0.1:5500/index.html
```

---

## 測試

本專案使用 Node.js 內建測試框架（`node:test`），零外部依賴。

### 先決條件
- Node.js 20+（建議）

### 指令

```bash
npm run test          # 執行全部測試
npm run test:unit     # 只跑單元測試
npm run test:smoke    # 只跑 Smoke Test
```

### 測試內容

#### Unit Test
檔案：`tests/unit/three-by-three-cube-engine.test.js`

- 轉法記號解析是否正確
- 不合法記號是否被擋下
- 單步與逆步是否互相抵消
- 打亂 + 逆打亂是否回到復原
- 隨機打亂是否避免連續同面

#### Smoke Test
##### 3x3 測試
檔案：`tests/smoke/three-by-three-lbl-solver.smoke.test.js`
- 執行 LBL 與最速解各 50 輪的隨機打亂煙霧測試
- 驗證最終是否均能完美回到復原狀態
- 斷言驗證最速解在統計上能比 LBL 節省總轉動步數
- 驗證 phase 邊界是否一致

##### 2x2 測試
檔案：`tests/smoke/two-by-two-solver.smoke.test.js`
- 針對 2x2 LBL 與最速解各執行 50 輪隨機打亂
- 驗證還原正確性，並斷言最速解步數必定小於或等於 LBL（滿足 God's Number 最短路徑）

---

## 瀏覽器支援

本專案使用 ES Module Import Maps 與 Web Workers，需要以下瀏覽器版本：

| 瀏覽器 | 最低版本 |
|---|---|
| Chrome | 89+ |
| Edge | 89+ |
| Firefox | 108+ |
| Safari | 16.4+ |

---

## 命名與維護規則

1. `application` 不放 Three.js 低階細節
2. `infrastructure` 不放解題演算法
3. `domain` 盡量不依賴 DOM
4. 新增演算法時，先補 `unit test` 或 `smoke test` 再合併
5. 檔名採「職責清楚」原則（例如 `three-by-three-lbl-solver.js`、`three-by-three-cube-view.js`）

---

## 已知限制

- 目前是前端單機版，無後端儲存
- LBL 模式的目標是教學可讀性（步數較多）；如需高效率還原可切換至最速解模式

---

## Roadmap

1. 加入 CI（例如 GitHub Actions）自動跑 `unit + smoke`
2. 補 E2E 測試（Playwright）驗證 UI 操作流程
3. **鏡頭辨識色塊功能**：透過裝置 Camera 即時辨識實體方塊顏色資訊
4. **跨裝置自適應 UI**：優化在不同裝置尺寸（手機、平板與桌機）上的 3D 渲染與操作面板排版佈局

---

## License

本專案採用 [Apache License 2.0](LICENSE) 授權。
