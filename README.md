# Rubik Cube 教學解題器（2x2 / 3x3）

這是一個以瀏覽器執行的魔術方塊教學解題專案，提供：

- 2x2 解題與逐步播放
- 3x3 LBL（Layer-by-Layer）分層解法與逐步播放
- 3D 互動視角（可旋轉）
- 顏色編輯、打亂公式輸入、隨機打亂

專案目標是讓使用者不只「得到答案」，而是能「跟著步驟學會怎麼還原」。

---

## 功能總覽

### 首頁（模式選擇）
- 可選擇進入 `2x2` 或 `3x3`
- 提供自動旋轉的 3D 視覺預覽

### 2x2 模式
- 支援手動上色
- 支援隨機可解打亂
- 支援逐步教學與自動播放

### 3x3 模式
- UI/UX 與 2x2 統一
- 支援打亂公式輸入與套用
- 使用 LBL 分層流程解題：
  1. 第一層十字
  2. 第一層角塊
  3. 第二層稜塊
  4. 第三層定向/置換（依步驟分段顯示）
- 可逐步播放、單步前進、回到打亂起點

---

## 專案結構

```text
Rubik Cube/
├─ index.html                  # 首頁
├─ two-by-two.html                    # 2x2 頁面
├─ three-by-three.html                    # 3x3 頁面
├─ home-page.js / home-page.css          # 首頁互動與樣式
├─ two-by-two.js                   # 2x2 入口（既有）
├─ three-by-three.js                      # 3x3 入口（薄層）
├─ app-theme.css                   # 共用主題樣式
├─ three-by-three.css                     # 3x3 頁面補充樣式
├─ start-local-server.bat      # 本機啟動（Windows）
├─ start-local-server.ps1      # 本機啟動（PowerShell）
├─ src/
│  ├─ ...                      # 2x2 既有 clean architecture 程式碼
│  └─ three-by-three/
│     ├─ three-by-three-main.js
│     ├─ application/
│     │  └─ three-by-three-app-controller.js  # UI 流程、事件、狀態管理
│     ├─ domain/
│     │  ├─ three-by-three-constants.js       # 常數、目標索引、公式宏
│     │  ├─ three-by-three-cube-engine.js     # 狀態轉換、轉法與解析
│     │  └─ three-by-three-lbl-solver.js      # 3x3 LBL 解題核心
│     └─ infrastructure/
│        └─ three-by-three-cube-view.js # Three.js 3D 呈現與旋轉動畫
├─ tests/
│  ├─ unit/
│  │  └─ three-by-three-cube-engine.test.js
│  └─ smoke/
│     └─ three-by-three-lbl-solver.smoke.test.js
└─ package.json                # 測試 scripts
```

---

## 架構設計（Clean Architecture）

### Application Layer
- 位置：`src/three-by-three/application/`
- 責任：整合 UI 元件、事件、狀態流、播放流程
- 不直接耦合演算法細節（透過 domain API 呼叫）

### Domain Layer
- 位置：`src/three-by-three/domain/`
- 責任：核心規則與解題邏輯
- `three-by-three-cube-engine.js`：方塊狀態與轉法運算
- `three-by-three-lbl-solver.js`：LBL 解法流程（可單獨測試）

### Infrastructure Layer
- 位置：`src/three-by-three/infrastructure/`
- 責任：3D 呈現、動畫、鏡頭與互動（Three.js）

這樣的分層讓「演算法修改」與「畫面修改」能分開進行，維護成本明顯下降。

---

## 啟動方式（避免 CORS）

請**不要直接雙擊 HTML**（`file://` 會被瀏覽器安全限制擋住）。

### Windows（建議）
1. 執行 `start-local-server.bat`  
或
2. 執行 `start-local-server.ps1`

啟動後使用瀏覽器開啟：

```text
http://127.0.0.1:5500/index.html
```

---

## 測試

本專案使用 Node 內建測試框架（`node:test`）。

### 先決條件
- Node.js 20+（建議）

### 指令

```bash
npm run test
npm run test:unit
npm run test:smoke
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
檔案：`tests/smoke/three-by-three-lbl-solver.smoke.test.js`

- 多輪隨機打亂（目前 12 輪）
- 每輪執行 LBL 解題
- 驗證最終是否回到復原狀態
- 驗證 phase 邊界是否一致

---

## 命名與維護規則（建議）

1. `application` 不放 Three.js 低階細節  
2. `infrastructure` 不放解題演算法  
3. `domain` 盡量不依賴 DOM  
4. 新增演算法時，先補 `unit test` 或 `smoke test` 再合併  
5. 檔名採「職責清楚」原則（例如 `three-by-three-lbl-solver.js`、`three-by-three-cube-view.js`）

---

## Git

專案已初始化 git，並含 `.gitignore`。

常用流程：

```bash
git status
git add .
git commit -m "your message"
```

---

## 已知限制

- 目前是前端單機版，無後端儲存
- 解法目標是教學可讀性，不是最短步數（非 speedcubing 最短解）

---

## 下一步建議

1. 加入 CI（例如 GitHub Actions）自動跑 `unit + smoke`
2. 補 E2E 測試（Playwright）驗證 UI 操作流程
3. [已完成] 將 2x2 也完全對齊同一套分層命名規範
4. **最速解功能**：增加一個最速解的功能，並在解題頁面上提供一個 toggle 可以選擇 LBL 或是最速解。
5. **鏡頭辨識色塊功能**：增加鏡頭辨識色塊的功能，讓使用者透過裝置上的 camera 即時辨識實體方塊顏色資訊。

