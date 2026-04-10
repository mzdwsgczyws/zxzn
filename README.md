# 量化自修正念 · 微信小程序

面向「自我观察与文化参考」的工具型小程序：**今日心象箴言**（含配图、建议与可选混元延展）、**道性十六型**情景测验、**量化自修记录**与轻量分析、**个人档案**（箴言上下文）；首页提供 **心象展馆**（每卦首次收录时间）与 **成就展馆**（心象成就与长按趣评）。数据默认**仅存本机**（`wx.setStorage`），未接自有后端业务库。

> **重要声明**：所有箴言与人格描述、建议与 AI 生成内容均**仅供文化学习与自我观察**，不构成医疗、心理咨询或命运断言；持续情绪与睡眠困扰请寻求专业帮助。

### 产品动线（精简）

| 动线 | 说明 |
|------|------|
| **每日一问** | 首页轻触开始 → 摇动 → 揭晓 → 读诗/释义/建议；可选 AI 漫谈（需云开发）。 |
| **自察分型** | 道性测验 → 十六型结果与自修提示；可重做，以最后一次为准。 |
| **量化记录** | 自修页填睡眠、情绪等滑动项 → 保存 → 刷新分析得侧重点（非诊断）。 |
| **档案与上下文** | 个人档案补齐箴言上下文项后，抽取时少打扰、建议与释义更贴情境。 |
| **展馆** | 心象展馆按时间看「首获」图鉴；成就展馆用趣味条件解锁勋章，长按看评语。 |

---

## 一、技术栈与运行要求

| 项目 | 说明 |
|------|------|
| 框架 | 微信小程序原生（WXML / WXSS / JS） |
| 基础库 | 建议 **≥ 3.7.1**（云开发 `wx.cloud.extend.AI`）；`project.config.json` 中 `libVersion` 已对齐 |
| 云开发 | 可选：在 `app.js` 中 `wx.cloud.init`，混元生文见首页「延展漫谈」 |
| 网络 | 天气使用 Open-Meteo，需在公众平台配置 request 合法域名 `https://api.open-meteo.com` |
| 地理编码 | 档案地区保存后请求 `https://geocoding-api.open-meteo.com` 解析经纬度（与 forecast 同系列，需在合法域名中配置）；**不使用地图选点与定位权限** |

### 目录结构（核心）

```
wx_program/
├── behaviors/            # page-analytics：页面停留与跳转边
├── app.js / app.json / app.wxss
├── pages/
│   ├── index/          # 首页：心象箴言主流程 + 展馆圆钮 + 底部三入口
│   ├── lot-hall/       # 心象展馆（每条首次获得时间）
│   ├── achieve-hall/   # 成就展馆（长按评语）
│   ├── personality/      # quiz / result 测验与结果
│   ├── track/            # 自修记录与同页分析摘要
│   ├── lottery/          # 独立心象箴言页（与首页共用 lottery-core）
│   └── profile/          # 个人档案
├── utils/
│   ├── personality.js    # 36 题 + 十六型 + calculatePersonality
│   ├── fortune.js        # 当日条目种子 buildFortuneMeta
│   ├── lottery-core.js   # 摇动、生成结果、缓存、画布
│   ├── lottery-history.js # 生成历史追加、展馆列表、成就计算
│   ├── usage-analytics.js # 本地使用统计（短键、截断、防抖写盘）
│   ├── lottery-advice.js # 建议列表决策与抽样
│   ├── lots.js / lots-data.js  # 64 条卦爻文案与等第映射
│   ├── almanac.js        # 节气、建除、宜忌（本地表）
│   ├── weather.js        # Open-Meteo 当前天气
│   ├── geocode.js        # Open-Meteo 地名 → 经纬度（档案保存时用）
│   ├── region-cn.js      # 国家 / 中国省与二级城市选项
│   ├── lot-art.js        # 配图 Canvas 绘制（按等第配色）
│   ├── lot-display.js    # 释义展示偏好（简/详/白话分行等）
│   ├── profile-lottery.js    # 抽取前档案是否「完整」
│   ├── analysis.js       # 自修记录分析
│   ├── storage-keys.js   # 本地存储键名
│   └── cloud-env.js      # 云环境 ID（若使用）
└── project.config.json
```

---

## 二、道性十六型人格：维度与题目

### 2.1 四个维度

问卷将人格倾向量化为四维比例，取值约在 **0～1**（展示为 0～100 分）：

| 维度 | 代码含义 | 高分端 | 低分端 |
|------|----------|--------|--------|
| **动 / 静** | `dong` / `jing` | 偏行动、外动 | 偏观察、内静 |
| **刚 / 柔** | `gang` / `rou` | 偏原则、直接 | 偏折中、委婉 |
| **散 / 聚** | `san` / `ju` | 偏并行、发散 | 偏聚焦、单线 |
| **显 / 藏** | `xian` / `cang` | 偏外显、表达 | 偏内敛、自守 |

题目共 **36 道**，每题二选一（`a` / `b`），分别对应上述键位计数；实现见 `utils/personality.js` 中 `QUESTIONS`（题干为情景化表述，四维各 **9** 题）：

- **动/静**：题 1～9（`dim: 'dj'`）
- **刚/柔**：题 10～18（`dim: 'gr'`）
- **散/聚**：题 19～27（`dim: 'sj'`）
- **显/藏**：题 28～36（`dim: 'xz'`）

### 2.2 计分与分型算法

1. 统计 8 个计数：`dong, jing, gang, rou, san, ju, xian, cang`（每题只增加所选一侧）。
2. 计算四维比例：
   - `动 = dong / (dong + jing)`（分母为 0 时用 0.5）
   - `刚 = gang / (gang + rou)`
   - `散 = san / (san + ju)`
   - `显 = xian / (xian + cang)`
3. 得到向量 **`vec = [动, 刚, 散, 显]`**。
4. 与预置 **16 个类型**的 **`vector`（质心）** 做欧氏距离平方 **`dist2`**，取距离最小者为当前类型。
5. 结果写入本地键 **`personalityResult_v1`**（见 `storage-keys.js`），包含 `typeId`、`typeName`、`scores`（四维百分数）、`summary`、`traits`、`risks`、`advice`、`detail` 等。

### 2.3 十六型一览（id · 类型名 · 参考人物）

以下为 `PERSONALITY_TYPES` 中与产品展示一致的核心信息（完整文案以代码为准）。

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

历史人物仅作**文化意象**，非宿命对应。测验可重复做，结果以最后一次保存为准。

---

## 三、今日心象箴言：全流程逻辑

心象箴言业务集中在 **`utils/lottery-core.js`**，首页与 `pages/lottery` 共用同一套本地缓存 **`lotteryToday_v2`**。每次成功生成会往 **`lotteryHistory_v1`**（见 `utils/lottery-history.js`）追加一条，供心象展馆与成就统计。

### 3.1 用户操作路径（首页）

1. **未抽取**：展示入口；若个人档案未满足「箴言上下文」四项（见下），可选提示去完善或「继续抽取」。
2. **摇动**：依赖加速度计累计有效摇动次数（当前默认 **9** 次），达标后调用 `drawLot`；模拟器可用「模拟摇动」。
3. **生成动画**：短暂 `anim` 后进入 `result`；结果写入当日缓存。
4. **揭晓**：用户点击后 `revealed=true`，绘制配图 Canvas，展示诗、释义、建议列表。
5. **混元延展漫谈**：在 `index.js` 内联调用 `wx.cloud.extend.AI` 流式接口（需已 `wx.cloud.init`）。
6. **重新抽取**：清除当日缓存回到入口（逻辑在同日内可重新生成）。

### 3.2 条目编号（lotId）如何决定：`buildFortuneMeta`

**目标**：在「同一微信用户、同一自然日、同一套档案与外部环境」下 **`lotId ∈ [0,63]` 稳定**；改档案、改日、改天气等会改变结果。

实现要点（`utils/fortune.js`）：

1. 取本地日期 **`dateStr = Y-M-D`**，计算当日 **干支** `gz`、**日五行** `wxDay`（相对 2000-01-01 的日序推算）。
2. 读取 **人格**：若已完成测验，带 `personalityTypeId` 与 `hasPersonality`；否则用占位。
3. 读取 **档案**：`age`、`gender`、`birthMonth`；**经纬度**来自用户填写国家/省/市后 **Geocoding 解析**（失败则为 0），**不调用地图选点与自动定位**。
4. **黄历包**（`utils/almanac.js`）：`jieqi`（节气表 2024–2030 等）、`jianchu`（建除十二神，与干支推算相关）。
5. **天气**：有坐标则请求 Open-Meteo，取 **WMO weathercode** 写入种子；失败则为 `na`。
6. **箴言上下文字段**（档案）：`recentState`（低/中/高）、`rhythmType`（早起/夜猫/不规律）、`focusTags`（多选标签排序后拼接）、`lotStylePref`（简/详/文言感/白话分行）。
7. **娱乐映射**：`ziweiHint`（由出生月与当前月衍生的宫位下标）、`bagua`（八卦之一，与 typeId/日干等相关）。
8. 将上述字段拼成 **单一字符串**，经 **FNV-1a 风格 `hashStr`** 得到 32 位无符号整数，**`lotId = hash % 64`**。

**不向用户展示**上述拼接串与中间参量（结果页只展示文化向文案）。

### 3.3 六十四卦条目与「等第」

- 文案数据源：`utils/lots-data.js`（按《周易》六十四卦序与 `lotId` 一一对应）。
- **等第**由 `utils/lots.js` 中 **`TIERS_BY_LOT_ID[lotId]`** 逐项绑定，使诗句、释义的整体语气与等第一致（避免「讼、否、剥」等偏警示文案却标上上/上之类错位）。
- **分布仍固定**（与建议池、配图配色统计一致）：上上 8、上 16、中 24、下 10、下下 6；加载时会校验数组长度与各档计数。
- `tierForId(id)` 读上述映射；`lotId` 仍由当日哈希决定，仅决定落到哪一条，不改变各条绑定的等第。

### 3.4 释义展示偏好：`lot-display.js`

根据档案 **`lotStylePref`** 对 `interpret` 做纯展示层处理（不改变 `lotId`）：如 **简练**取首句、**白话分行**在标点处换行等。生成当日会把 **`lotStylePref` 写入缓存**，避免次日恢复时因改偏好而错位。

### 3.5 建议列表：`lottery-advice.js`

- 根据 **等第、建除、节气季节、天气特征、年龄段、性别、人格四维阈值** 等，从多条候选 **tagged 建议**中构造池子。
- 用 **`hashStr(dateStr|lotId|tier|…|人格键|近期状态|作息|关注标签)`** 作为种子，**`mulberry32`** 打乱后 **去重抽取** 约 7 条，展示为编号列表。
- 文案设计为 **陈述式建议**，避免暴露「因你是某型所以…」的推断口吻。

### 3.6 配图 Canvas：`lot-art.js`

- 使用旧版 **`wx.createCanvasContext` + `canvas-id`**（避免 2d Canvas 部分机型黑屏）。
- 背景与装饰色由 **`lot.tier`** 分档：**上上金、上红、中蓝、下灰、下下黑**（深底+可读文字与描边）。
- `lottery-core.js` 的 `paintLotToCanvas` 传入 `id/title/tierLabel/tier`。

### 3.7 抽取前档案完整性：`profile-lottery.js`

以下**全部满足**时，首页不再弹出「是否去完善档案」：

- `recentState ∈ { low, mid, high }`
- `rhythmType ∈ { early, night, irregular }`
- `lotStylePref ∈ { brief, rich, classical, plain }`
- `focusTags` 为非空数组，且至少一项属于 `work/relation/health/study/finance/family/rest`

> **`wx.showModal` 的 `confirmText` / `cancelText` 各 ≤ 4 个汉字**，否则部分客户端会静默失败。

### 3.8 心象展馆与成就展馆

- **数据**：依赖 **`lotteryHistory_v1`**（每次 `finalizeDraw` 追加一条，见 `lottery-history.js`）。
- **心象展馆**（`pages/lot-hall`）：六十四卦按「**首次收录**」的时间升序列出，展示条目名、等第、首次日期时刻。
- **成就展馆**（`pages/achieve-hall`）：基于历史记录计算多枚成就；**长按**成就块约 0.4s 显示解锁或未解锁的趣味评语，松手即关闭。
- **入口**：首页底栏上方的双圆形按钮；档案页底部提供同名文字入口，便于从「填资料」场景跳转。

---

## 四、量化自修记录与分析

- 存储键：**`trackRecords_v1`**，结构为日记数组（字段以 `pages/track/track.js` 为准：如睡眠时长、生气次数、屏幕时间、步行、静坐等）。
- **`utils/analysis.js`**：对**最近至多 7 条**做简单平均与规则文案，生成「自修侧重点」类说明，**非医疗诊断**。

---

## 五、个人档案（`userProfile_v2`）

除年龄、性别、出生月、**参考地区**（国家 → 省/直辖市 → 二级城市 + 可选详细文字；保存时 Geocoding 写入 `latitude`/`longitude`/`locationName`）外，可选填 **箴言上下文** 字段（见第三节），用于：

- 参与 **`buildFortuneMeta` 哈希**；
- 参与 **`lottery-advice`** 候选与抽样种子；
- 控制 **释义排版**（`lotStylePref`）。

---

## 六、本地存储键一览

| 键名常量 | 含义 |
|----------|------|
| `PERSONALITY_RESULT` | 道性测验最新结果 |
| `TRACK_RECORDS` | 自修记录列表 |
| `LOTTERY_TODAY` | 当日心象箴言缓存（lotId、revealed、adviceList、lotStylePref 等） |
| `LOTTERY_HISTORY` | 历次生成时间线（ts、dateStr、lotId、tier、title），用于展馆与成就 |
| `USER_PROFILE` | 个人档案与箴言上下文 |
| `USAGE_STATS` | 本地使用统计（短键 JSON），见下节与 `utils/usage-analytics.js` |

隔离说明见 `storage-keys.js` 文件头注释（按微信账号沙箱，非服务端用户 id）。

### 6.1 使用统计（当前仅本机）

实现：`utils/usage-analytics.js` + `behaviors/page-analytics.js`（主要页面已挂载）+ `app.js` 前后台。

**存储键** `usageStats_v1` 为**短键**对象，减小体积示例：

| 键 | 含义 |
|----|------|
| `v` | 结构版本（当前 1） |
| `fo` / `lo` | 首次打开时间戳 / 最近一次冷启动时间戳 |
| `lc` | 累计冷启动次数（`onLaunch`） |
| `d` | 按自然日聚合：`{ "2026-4-10": { o: 前台打开次数, t: 当日页面停留毫秒累计 } }` |
| `ss` | 会话区间 `[startTs, endTs][]`（有上限，先入先出截断） |
| `p` | 各路由累计 `{ "pages/index/index": [访问次数, 停留毫秒累计] }` |
| `nv` | 页面跳转边 `[fromRoute, toRoute, ts][]`（有上限） |
| `sh` | 分享次数按 path 或自定义 key 聚合 |
| `ev` | 稀疏事件流 `[ts, code, extra?][]`（如 `lc`、`share`、`lot_draw`、`quiz_done`、`track_save`、`profile_save`） |

写入策略：**防抖落盘** + **进入后台 `onHide` 强制 flush**，并对 `ss` / `nv` / `ev` **截断长度**，避免 Storage 膨胀。

**合规提示**：若未来上报服务端，需在隐私政策与用户同意范围内**最小必要**采集，并支持关闭。

**还可扩展、仍建议保持克制的指标**（未默认写入者可按需加 `recordBiz`）：

- **入口场景**：`onLaunch` / `onShow` 的 `scene`（微信场景值），用于区分分享、搜索、扫码等来源。  
- **功能漏斗**：AI 漫谈点击次数、揭晓率（需与当日箴言缓存关联）、测验中途退出题号。  
- **错误与性能**：接口失败码、请求耗时分桶（脱敏、采样上报）。  
- **设备粗粒度**：系统、基础库版本、屏幕宽高档（不做指纹）。  

### 6.2 多用户规模下的存储与读取（服务端方向）

> 小程序端 **`wx.setStorage` 无法跨设备汇总**；「几万～几十万用户」与**高并发读**指**自建或云开发后端**上的数据层，而非单机 Storage。

**省空间**

- **事件流**（跳转、分享、停留）用 **追加型** 窄表：定长或短字段（`uid`、`ts`、`evt`、少量数值参数），避免冗长 JSON。  
- **序列化**：服务侧优先 **Protobuf / MessagePack**；冷归档可用 **Parquet + ZSTD** 等列式压缩。  
- **路径维表**：`page_id`（如 `uint16`）替代重复字符串路由。  
- **预聚合**：按日写入 `DAU、人均时长、分页面 PV` 的**汇总表**，读报表不扫全量明细。  

**读速度与并发**

- **分片**：按 `user_id` 或哈希分库分表，保证「查一人」落在单分片。  
- **索引**：`(user_id, ts)`、`(day, evt_type)` 等；禁止大表无索引统计。  
- **缓存**：当日计数、会话态可 **Redis / 云缓存**，带 TTL，异步落库。  
- **读写分离**：OLTP 写主库，分析走从库或 **ClickHouse / 数仓**。  

**与本项目衔接**：`usageStats_v1` 可作为客户端缓冲；上云时用**同语义**批量上报 `ev` / `nv`，服务端落库后再压缩或清空本地。

---

## 七、云开发与混元（可选）

- 环境 ID 配置：`utils/cloud-env.js`（与小程序控制台云开发环境一致）。
- `app.json` 需 **`"cloud": true`**，`app.js` 中 **`wx.cloud.init`**。
- 首页揭晓后的 **「混元 · 延展漫谈」** 在 **`pages/index/index.js` 内联**流式调用 `hunyuan-exp` / `hunyuan-turbos-latest`（避免子模块未打入分包的问题）。
- 正式上线若含 **AI 生成内容展示**，需自行确认 **类目、深度合成/算法备案** 等合规要求。

---

## 八、开发与发布提示

1. 用微信开发者工具打开 **`wx_program`** 目录（或你的 miniprogramRoot）。
2. 填写与后台一致的 **AppID**；开通云开发后替换 **`cloud-env.js`** 中的环境 ID。
3. **合法域名**：配置 `https://api.open-meteo.com`（天气）与 **`https://geocoding-api.open-meteo.com`**（地区→坐标）；云开发 AI 走微信侧能力，按官方文档勾选权限。
4. 若后续接入**定位/相册等隐私接口**，`permission` 与 `requiredPrivateInfos` 的 `desc` 需符合平台字数等要求（如 ≤30 字）。
5. 发布流程见[微信文档：小程序协同工作与发布](https://developers.weixin.qq.com/miniprogram/dev/framework/quickstart/release.html)。

---

## 九、版本与维护

- 卦爻文案与等第映射调整时，同步检查 **`lots-data.js`**、**`lots.js`（`TIERS_BY_LOT_ID` 分布 8/16/24/10/6）**、**`fortune.js` / `lottery-advice.js`** 的注释与本文档第三节。
- 展馆与成就规则变更时，同步 **`lottery-history.js`**（成就定义与统计逻辑）及本文档 **§3.8**。
- 若增加服务端同步，需在存储层引入 **用户唯一标识**（如 openid）并迁移读写逻辑，本文档「用户隔离」一节需改写。

### 后续可迭代（保持克制）

以下为与当前架构兼容、但不急于上的方向，避免功能膨胀：

- **周/月小结**：仅基于已有 `trackRecords` 与 `lotteryHistory` 做本地汇总页，不接后台。
- **导出**：将自修记录或某次箴言全文导出为文本（`wx.share` / 复制），便于用户自行备份。
- **深色模式**：用 `prefers-color-scheme` 或开关切换一套 WXSS 变量，与现有紫金/纸本风并列。

---

*文档与当前仓库代码同步撰写；如有功能变更请以源码为准。*
