# Rubik Cube 教學解題器（2x2 / 3x3）

這是一個以瀏覽器執行的魔術方塊教學解題專案，提供：

- 2x2 與 3x3 LBL（Layer-by-Layer）分層解題與逐步播放
- 2x2 與 3x3 雙向尋優最速解（Fastest Solve）與逐步播放
- 3D 互動視角（可旋轉，具備防止編輯與解題時自動旋轉的穩定鎖定）
- 顏色編輯、打亂公式輸入、隨機打亂

專案目標是讓使用者不只「得到答案」，而是能「跟著步驟學會怎麼還原」，同時可切換至最速解模式查看更有效率的復原路徑。

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
  - 頂層階段：拆分為 OLLO（定向）與 PLL（置換）兩個 BFS 巨集搜尋階段，避免狀態空間爆炸並尋求最少旋轉步數
  - 整體平均步數較 LBL 節省 ~18% 的旋轉步數，且生成解答僅需 ~290ms
- 可逐步播放、單步前進、回到打亂起點

---

## 專案結構

```text
Rubik Cube/
├─ index.html                       # 首頁
├─ two-by-two.html                  # 2x2 頁面
├─ three-by-three.html              # 3x3 頁面
├─ home-page.js / home-page.css     # 首頁互動與樣式
├─ two-by-two.js                    # 2x2 入口頁面綁定
├─ three-by-three.js                # 3x3 入口頁面綁定
├─ app-theme.css                    # 共用科技感暗色系樣式（包含 iOS Toggle）
├─ three-by-three.css               # 3x3 頁面補充樣式
├─ start-local-server.bat           # 本機啟動（Windows）
├─ start-local-server.ps1           # 本機啟動（PowerShell）
├─ src/
│  ├─ two-by-two/                   # 2x2 模組（Clean Architecture 結構）
│  │  ├─ two-by-two-main.js          # 2x2 入口主控
│  │  ├─ application/
│  │  │  └─ two-by-two-app-controller.js   # 2x2 狀態與事件控制器
│  │  ├─ config/
│  │  │  └─ ...                      # 2x2 公式、移動轉換配置
│  │  ├─ domain/
│  │  │  └─ two-by-two-solver-service.js   # 2x2 LBL 與雙向 BFS 求解器
│  │  └─ infrastructure/
│  │     └─ two-by-two-cube-view.js        # 2x2 Three.js 3D 渲染與無旋轉鎖定
│  └─ three-by-three/                 # 3x3 模組（Clean Architecture 結構）
│     ├─ three-by-three-main.js     # 3x3 入口主控
│     ├─ application/
│     │  └─ three-by-three-app-controller.js # 3x3 狀態與事件控制器
│     ├─ domain/
│     │  ├─ three-by-three-constants.js    # 常數、目標索引、公式宏
│     │  ├─ three-by-three-cube-engine.js  # 狀態轉換、轉法與解析
│     │  └─ three-by-three-lbl-solver.js   # 3x3 LBL 與雙階段最速解求解器
│     └─ infrastructure/
│        └─ three-by-three-cube-view.js    # 3x3 Three.js 3D 渲染與動畫
├─ tests/
│  ├─ unit/
│  │  └─ three-by-three-cube-engine.test.js
│  └─ smoke/
│     ├─ three-by-three-lbl-solver.smoke.test.js
│     └─ two-by-two-solver.smoke.test.js
└─ package.json                     # 測試與執行 scripts
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
- LBL 模式的目標是教學可讀性（步數較多）；如需高效率還原可切換至最速解模式

---

## 下一步建議

1. 加入 CI（例如 GitHub Actions）自動跑 `unit + smoke`
2. 補 E2E 測試（Playwright）驗證 UI 操作流程
3. [已完成] 將 2x2 也完全對齊同一套分層命名規範
4. [已完成] **最速解功能**：在 2x2 與 3x3 解題頁面提供高質感 iOS 滑動 Toggle，支援極速尋優最速解（2x2 平均 15 毫秒、3x3 平均 290 毫秒）。
5. **鏡頭辨識色塊功能**：增加鏡頭辨識色塊的功能，讓使用者透過裝置上的 camera 即時辨識實體方塊顏色資訊。
6. **跨裝置自適應 UI**：支援跨裝置自適應 UI，優化在不同裝置尺寸（如手機、平板與桌機）上的 3D 渲染與操作面板排版佈局。



