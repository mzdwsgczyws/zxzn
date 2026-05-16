# 道性自察 · 微信小程序

面向「自我观察与文化参考」的工具型小程序：**今日心象箴言**（含配图与建议）、**道性十六型**情景测验、**量化自修记录**与轻量分析、**个人档案**（箴言上下文）；首页提供 **心象日历**（按日抽签记录的月历与层级示意图，仅供自察）、**心象展馆**（每卦首次收录时间）、**成就展馆**（心象成就与长按趣评）、**修行段位**、**节气徽章**、**每周挑战**、**道性配对**与**年度修炼报告**。算法层深度集成**梅花易数起卦**、**紫微斗数命宫**、**六十四卦卦气旺衰**三大传统体系。数据默认**仅存本机**（`wx.setStorage`），未接自有后端业务库。

> **重要声明**：所有箴言与人格描述与建议均**仅供文化学习与自我观察**，不构成医疗、心理咨询或命运断言；持续情绪与睡眠困扰请寻求专业帮助。

### 产品动线（精简）

| 动线 | 说明 |
|------|------|
| **每日一问** | 首页轻触开始 → 摇动 → 揭晓 → 读诗/释义/建议。 |
| **自察分型** | 道性测验 → 十六型结果与自修提示；可重做，以最后一次为准。 |
| **量化记录** | 自修页填睡眠、情绪、恢复/耗竭、五行相关代理项等 → 保存；**五行雷达图** + 分轴卡片；**刷新分析**得带理由的排序建议（综合道性/档案/自选重点，非诊断）。 |
| **档案与上下文** | 个人档案补齐箴言上下文项后，抽取时少打扰、建议与释义更贴情境。 |
| **展馆与日历** | **心象日历**：按自然日展示抽签记录（末次）+ 层级示意图（历史可视化，非前瞻推断）；**心象展馆**：「首获」图鉴；**成就展馆**：趣味解锁条件（按日历日统计抽签），长按看评语。 |
| **每日打卡** | 首页在「心象」idle/result 时展示连续/累计打卡与「今日打卡」；数据仅存本机，见 `utils/checkin.js` 与 `docs/check-in-system-brief.md`。 |
| **修行段位** | 个人档案顶部展示十级品阶（初入道门 → 无极大道），综合打卡、抽签、成就、自修等积分实时计算。 |
| **节气徽章** | 成就展馆底部 24 宫格，在对应节气前后 ±3 天内有抽签即收集该节气徽章；附带 3 个新成就。 |
| **每周挑战** | 首页打卡条下方展示基于五行短板推荐的每周 5 天连续挑战，完成可获限定徽章。 |
| **道性配对** | 从道性测验结果页邀请好友配对，基于四维兼容度算法分析两人匹配度与相处建议。 |
| **年度报告** | 个人档案「展馆与报告」入口，Spotify Wrapped 风格展示全年抽签/打卡/自修/成就数据及年度关键词。 |
| **分享卡片** | 首页/lottery 结果区可生成箴言海报（poster-engine · tplMaxim），成就展馆已解锁成就可生成分享图（tplAchieve）。 |

### 玄学算法引擎（与代码同步 · 2026-05）

签号与箴言的核心决策链路深度集成三大传统体系，用户填写完整出生数据后自动切换至梅花易数起卦路径：

- **梅花易数起卦**（`utils/meihua-yishu.js`）
  - 「时间 + 命数」混合起卦法：融合当前农历时间（天时）与用户出生命数（人命），使同一时刻不同人得不同卦。
  - 先天八卦数映射、体用判断（动爻位置决定体卦与用卦）、五行生克吉凶评分（-3 ~ +3）。
  - 变卦计算（动爻阴阳互变）、互卦计算（2-4 爻/3-5 爻），用于辅助趋势判断。
  - 签号直接由梅花本卦的上下卦组合映射到周易六十四卦序（`lots-data.js` 索引）。
- **紫微斗数简排**（`utils/ziwei-lite.js`）
  - 命宫安置（顺月逆时）、身宫安置、五虎遁推宫干、纳音五行局（水二/木三/金四/土五/火六）。
  - 十二宫排列 + 今日流日宫位 → 映射箴言领域权重（财帛→finance、官禄→work、疾厄→health 等）。
- **六十四卦卦气旺衰**（`utils/yijing-hexagram.js`）
  - 64 卦八宫归属与五行属性；按当前节气季节判断卦气：旺(+2)/相(+1)/休(0)/囚(-1)/死(-2)。
  - 卦气影响箴言整体语气：旺相 → 鼓励行动；囚死 → 提醒内省、韬光养晦。
- **农历转换**（`utils/lunar-calendar.js`）：1900-2100 年压缩查表法，公历↔农历精确转换。
- **向后兼容**：出生数据不全时自动回退到 hashStr fallback 路径，老用户体验不退化。

### 近期补充与修复（与代码同步 · 2026-05）

- **成就展馆**（`utils/lottery-history.js`）
  - **同一自然日多次抽签只计 1 日**：`drawCount`、十日/三十日类成就按「有签日历日」统计。
  - **连续档（连中三元 / 逆风三连等）**：按**自然日**，每日取**最后一次**抽签等第参与连续判定。
  - **同签重复成就**：按同一 `lotId` 出现在**不同日期**的天数计。
  - 成就文案见 **`ACHIEVEMENT_DEFS`**；计算入口 **`buildAchievementState`**、`computeAchievements`。
- **心象日历 / 按日示意图**（`pages/fortune-trend/` + `utils/fortune-trend-candles.js`）
  - 柱状示意衔接：**当日示意起点衔接上一日示意终点**（`chainedOHLCFromTier`，仅为图形连贯）。
  - **Y 轴自适应**：按当期可见区间加留白绘制。
- **首页签图（Canvas）**
  - 首页 `scroll-view` **关闭 `enhanced`**（`pages/index/index.wxml`），避免 **iOS 上原生 `canvas-id` 错位到视口左上角**；心象日历页同类处理（`pages/fortune-trend/fortune-trend.wxml`）。
- **道性测验结果 · 人物肖像**（`pages/personality/result/`）
  - `<image>` **仅用分包静态路径**，禁止把 `wx.getImageInfo` 返回的本地 path 绑给 `<image>`（部分基础库下仅 canvas 可用）。
  - **`portraitImgBind`**：`loadPortraitSubpackage` 成功后延迟再挂载；**`_portraitShowGen`** 防止多次 `onShow` 异步交错。
  - **`binderror`**：jpg → png → 再拉分包后重试 jpg；海报/分享仍走 **`getImageInfo` + Canvas**。
  - **保存高清海报**：`result.js` 内 Canvas 2D + 旧 canvas 回退；右上小程序码 `personality-portraits/index.jpg|png`；`app.json` 相册权限文案。
- **今日建议去重**（`utils/lottery-advice.js` · `lottery-core.js`）
  - 列表内尽量避免相邻两条同属 **`cat`**；本轮抽签完成后把正文记入 **`lotteryAdviceRecent_v1`**（见 `storage-keys.js`），**下一轮优先避让上一轮条目**，减轻重复感。
- **今日心象箴言**：`lottery-core.js` 抽签版本号、`clearRect` 等，减少跨页重抽叠影。

---

## 一、技术栈与运行要求

| 项目 | 说明 |
|------|------|
| 框架 | 微信小程序原生（WXML / WXSS / JS） |
| 基础库 | `project.config.json` 中 `libVersion` 可按需调整 |
| 网络 | 天气使用 Open-Meteo，需在公众平台配置 request 合法域名 `https://api.open-meteo.com` |
| 地理编码 | 档案地区保存后请求 `https://geocoding-api.open-meteo.com`（需在合法域名中配置）；**不使用地图选点与定位权限** |
| 相册 | 道性结果页「保存海报」会请求 **`scope.writePhotosAlbum`**（见 `app.json` → `permission`） |
| 分包 | `portrait-assets`：十六型肖像与小程序码图；`app.json` 中 `preloadRule` 预下载；页面内仍会 `wx.loadSubpackage` 兜底 |

**界面规范**：紫金墨配色见 **`docs/UI_DESIGN_SYSTEM.md`**。

### 目录结构（核心）

```
wx_program/
├── docs/
├── behaviors/
├── app.js / app.json / app.wxss
├── pages/
│   ├── index/           # 心象主流程 + 展馆入口（scroll-view 勿开 enhanced，配合 Canvas）
│   ├── fortune-trend/   # 心象日历：月历 + 按日层级示意图（历史记录可视化）
│   ├── lot-hall/
│   ├── achieve-hall/
│   ├── personality/     # quiz / result
│   ├── track/
│   ├── lottery/
│   ├── theory-intro/
│   ├── profile/
│   ├── compatibility/   # 道性配对
│   └── annual-report/   # 年度修炼报告
├── utils/
│   ├── lottery-core.js / lottery-history.js / lottery-advice.js / lottery-advice-corpus.js
│   ├── fortune.js / fortune-trend-candles.js / fortune-trend-calendar.js
│   ├── lot-art.js / lot-display.js / profile-lottery.js
│   ├── personality.js / checkin.js / usage-analytics.js
│   ├── lots.js / lots-data.js / almanac.js / weather.js / geocode.js / region-cn.js
│   ├── lunar-calendar.js          # 公历↔农历转换（1900-2100 查表法）
│   ├── meihua-yishu.js            # 梅花易数起卦引擎（体用生克、变卦互卦）
│   ├── ziwei-lite.js              # 紫微斗数简排（命宫、五行局、流日宫位）
│   ├── yijing-hexagram.js         # 64 卦元数据（八宫归属、卦气旺衰）
│   ├── analysis.js / cultivation-model.js / five-elements-chart.js
│   ├── lottery-shake-sensory.js
│   ├── poster-engine.js          # 海报生成引擎（tplMaxim / tplAchieve / tplPersonality）
│   ├── cultivation-rank.js       # 十级修行品阶
│   ├── solar-badges.js           # 24 节气徽章收集
│   ├── weekly-challenge.js       # 每周挑战系统
│   ├── compatibility.js          # 道性配对算法
│   ├── annual-report.js          # 年度报告数据聚合
│   └── storage-keys.js
├── subpackages/portrait-assets/
└── project.config.json
```

### 改动入口速查（维护）

| 模块 | 主要入口 | 说明 |
|------|-----------|------|
| **首页心象** | `pages/index/index.*` | 调用 `lottery-core`；`scroll-view` 勿启用 **enhanced**（iOS 签图画布错位）。 |
| **签图 Canvas** | `utils/lottery-core.js` · `lot-art.js` | `canvas-id`；`renderLotArt` / `paintLotToCanvas`。 |
| **历史 / 成就 / 按日序列** | `utils/lottery-history.js` | `appendLotteryDraw`、`getDailyTrendSeries`、`buildAchievementState`、`ACHIEVEMENT_DEFS`。 |
| **建议列表** | `utils/lottery-advice.js` · `lottery-advice-corpus.js` | `computeLotteryAdvices`；轮盘赌加权 + 梅花/紫微/卦气权重；最近 3 轮去重。 |
| **梅花易数** | `utils/meihua-yishu.js` | `castMeihua(now, birthData)`：时间+命数混合起卦，返回体用生克分数。 |
| **紫微简排** | `utils/ziwei-lite.js` | `getZiweiBasic` / `getTodayPalace`：命宫安置、五行局、今日流日宫位。 |
| **卦气旺衰** | `utils/yijing-hexagram.js` | `getGuaQi` / `hexagramIdFromGua`：64 卦八宫五行 + 季节旺衰。 |
| **农历转换** | `utils/lunar-calendar.js` | `solarToLunar`：1900-2100 压缩查表法。 |
| **按日示意图绘制** | `utils/fortune-trend-candles.js` | 层级示意衔接、Y 轴缩放、刻度。 |
| **道性结果 / 人像** | `pages/personality/result/result.js` · `result.wxml` | `portraitImgBind`、海报导出、`_portraitShowGen`。 |
| **分包肖像** | `subpackages/portrait-assets/` · `app.json` | 路径与 `personalityPortraitSrc` 一致。 |
| **摇动反馈** | `lottery-core.js` · `lottery-shake-sensory.js` | 首页 / lottery 卸载时 teardown。 |
| **分享海报** | `utils/poster-engine.js` | `generate` + 模板（`tplMaxim` / `tplAchieve`）；页面中放离屏 `<canvas type="2d">` 即可。 |
| **修行段位** | `utils/cultivation-rank.js` | `computeRank()`：综合 6 项数据源 → 10 级品阶 + 进度条。 |
| **节气徽章** | `utils/solar-badges.js` | `computeSolarBadges()`：扫描抽签历史 × 24 节气日期 ±3 天。 |
| **每周挑战** | `utils/weekly-challenge.js` | `getCurrentChallenge()` / `updateChallengeProgress()`；基于五行最弱轴推荐。 |
| **道性配对** | `utils/compatibility.js` · `pages/compatibility/` | 四维兼容度算法；好友分享带 `typeId` 参数。 |
| **年度报告** | `utils/annual-report.js` · `pages/annual-report/` | `computeAnnualReport(year)`：按年聚合全维度数据 + 年度关键词。 |

---

## 二、道性十六型人格：维度与题目

### 2.1 四个维度

问卷将倾向量化为四维比例（展示为 0～100 分）：

| 维度 | 代码含义 | 高分端 | 低分端 |
|------|----------|--------|--------|
| **动 / 静** | `dong` / `jing` | 偏行动、外动 | 偏观察、内静 |
| **刚 / 柔** | `gang` / `rou` | 偏原则、直接 | 偏折中、委婉 |
| **散 / 聚** | `san` / `ju` | 偏并行、发散 | 偏聚焦、单线 |
| **显 / 藏** | `xian` / `cang` | 偏外显、表达 | 偏内敛、自守 |

题目共 **36** 道，每题二选一；四维各 **9** 题，详见 **`utils/personality.js`** 中 **`QUESTIONS`**。

### 2.2 计分与分型（摘要）

统计八计数 → 算四维比例 → 向量与 **16** 个类型 **`vector`** 比欧氏距离平方 → 最近者为类型。结果写入 **`personalityResult_v1`**（`storage-keys.js`：`PERSONALITY_RESULT`）。

### 2.3 十六型一览（id · 类型名 · 参考人物）

历史人物仅为文化意象，非宿命对应；完整文案以代码为准。

| id | 类型名 | 参考人物 |
|----|--------|----------|
| 0 | 阳行开势型 | 刘邦 |
| 1 | 阳行定势型 | 朱元璋 |
| 2 | 阳流应变型 | 苏轼 |
| 3 | 阳流归元型 | 曾国藩 |
| 4 | 阴守外放型 | 诸葛亮 |
| 5 | 阴守定元型 | 王阳明 |
| 6 | 阴观流转型 | 李白 |
| 7 | 阴观归一型 | 陶渊明 |
| 8 | 阳潜开源型 | 韩信 |
| 9 | 阳潜定核型 | 张良 |
| 10 | 阳潜流形型 | 玄奘 |
| 11 | 阳潜归核型 | 司马迁 |
| 12 | 阴潜外化型 | 岳飞 |
| 13 | 阴潜定道型 | 朱熹 |
| 14 | 阴潜游化型 | 曹雪芹 |
| 15 | 阴潜守一型 | 陈抟 |

---

## 三、今日心象箴言（摘要）

- **签号决策**：`utils/fortune.js` **`buildFortuneMeta`**（有完整出生数据时由梅花易数起卦决定 `lotId`，否则 fallback 到 hashStr；返回梅花卦象、紫微命宫、卦气旺衰详情）。
- **文案与等第**：`lots-data.js` · **`lots.js`** `TIERS_BY_LOT_ID`。
- **建议**：`lottery-advice.js`（多池 + 轮盘赌加权抽样；梅花体用生克→语气权重、紫微宫位→领域权重、卦气→整体语气调整；最近 3 轮去重）。
- **配图**：`lot-art.js` + 旧版 Canvas。
- **展馆 / 成就**
  - 历史：**`lotteryHistory_v1`**。
  - **成就**：自然日去重、末抽等第、重复签按不同日期计数；改规则编辑 **`lottery-history.js`**。
  - **心象日历数据**：`getDailyTrendSeries`，同日多次取**最后一次**。

---

## 四、自修记录与五行雷达（摘要）

近窗记录与分析见 **`cultivation-model.js`**（经 **`analysis.js`**）；五行雷达 **`five-elements-chart.js`** · **`pages/track`**。

---

## 五、个人档案（摘要）

键 **`userProfile_v2`**；参与箴言种子与建议池；档案完整性 **`profile-lottery.js`**。档案页可填写 **出生公历年/月/日 + 出生时辰**（12 时辰 picker），用于梅花易数起卦与紫微斗数命宫排盘。

---

## 六、本地存储键（节选）

| 常量 | 含义 |
|------|------|
| `LOTTERY_TODAY` | 当日箴言缓存 |
| `LOTTERY_HISTORY` | 抽签历史（展馆 / 成就） |
| `LOTTERY_ADVICE_RECENT` | **上一轮建议纯文本**，供下次抽签避让重复 |
| `USER_PROFILE` | 档案 |
| `PERSONALITY_RESULT` | 道性最新结果 |
| `TRACK_RECORDS` / `TRACK_PRIORITIES` | 自修与重点 |
| `CHECKIN_STATE` | 打卡 |
| `USAGE_STATS` | 本地使用统计 |
| `WEEKLY_CHALLENGE` | 每周挑战状态 |
| `CHALLENGE_BADGES` | 挑战徽章列表 |

详见 **`utils/storage-keys.js`**。

---

## 七、开发与发布

1. 微信开发者工具打开 **`wx_program`**，配置 AppID。
2. 合法域名：`api.open-meteo.com`、`geocoding-api.open-meteo.com`。
3. 发布参见[微信文档：小程序发布](https://developers.weixin.qq.com/miniprogram/dev/framework/quickstart/release.html)。

> 若需恢复曾移除的云开发混元实现，见同级 **`wx_program_backup_cloud_hunyuan/`**（若有）。

**Git 远程**：可使用 SSH，`origin` 示例：`git@github.com:mzdwsgczyws/zxzn.git`。本地默认分支曾为 **`master`** 时，可推送：`git push -u origin master:main`。

---

## 八、版本与维护

### 8.1 近期主题（2026-05）

- 成就自然日与末抽口径、按日层级示意图衔接与 Y 轴、iOS Canvas + enhanced 规避、道性人像 `portraitImgBind`、建议避让上一轮、`LOTTERY_ADVICE_RECENT`、抽签叠影修复等。
- **七大新功能**：箴言分享卡、成就分享卡、修行段位系统（10 级品阶）、节气限定徽章（24 节气 + 3 成就）、道性配对（四维兼容度算法）、年度修炼报告（道观 Wrapped）、每周挑战（五行短板自动出题）。
- **抽签算法精度优化**：天气码/展示偏好移出签号种子、日干支基准修正（甲辰）、seasonal.js 死代码清理、箴言池浮点权重轮盘赌、catBoost 上限提升（+5/-4）、数据驱动箴言扩展至 3 条、最近 3 轮去重、经纬度精度降级（~1km）。
- **周易玄学算法深度集成**：新增梅花易数起卦引擎（`meihua-yishu.js`）、紫微斗数简排（`ziwei-lite.js`）、64 卦元数据与卦气旺衰（`yijing-hexagram.js`）、公历↔农历转换（`lunar-calendar.js`）；档案页新增出生年/日/时辰字段；签号由梅花本卦直接映射、箴言权重受体用生克+紫微宫位+卦气三重调节。

### 8.2 维护提示

- 卦爻 / 等第 / 种子逻辑：`lots-*`、`fortune.js`、`lottery-advice*`。
- 玄学引擎：`meihua-yishu.js`（梅花起卦）、`ziwei-lite.js`（紫微简排）、`yijing-hexagram.js`（卦气旺衰）、`lunar-calendar.js`（农历转换）。
- 展馆成就：`lottery-history.js`、`ACHIEVEMENT_DEFS`、`buildAchievementState`。
- 人像 / 海报 / 分包：`pages/personality/result/*`、`app.json`。
- 打卡：`utils/checkin.js`、`docs/check-in-system-brief.md`。
- 段位 / 徽章 / 挑战：`cultivation-rank.js`、`solar-badges.js`、`weekly-challenge.js`。
- 配对 / 年报：`compatibility.js`、`annual-report.js`、对应 `pages/` 目录。
- 海报引擎：`poster-engine.js`，各页面离屏 `<canvas type="2d" id="poster-canvas">`。

---

*文档力求与当前仓库一致；具体以实现代码为准。*
