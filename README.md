# 量化论道修身 · 微信小程序

面向「自我观察与文化参考」的工具型小程序：道性十六型测验、量化修行记录、今日灵签（含混元延展漫谈）、个人档案。数据默认**仅存本机**（`wx.setStorage`），未接自有后端业务库。

> **重要声明**：所有签文、人格描述、建议与 AI 生成内容均**仅供文化学习与自我观察**，不构成医疗、心理咨询或命运断言；持续情绪与睡眠困扰请寻求专业帮助。

---

## 一、技术栈与运行要求

| 项目 | 说明 |
|------|------|
| 框架 | 微信小程序原生（WXML / WXSS / JS） |
| 基础库 | 建议 **≥ 3.7.1**（云开发 `wx.cloud.extend.AI`）；`project.config.json` 中 `libVersion` 已对齐 |
| 云开发 | 可选：在 `app.js` 中 `wx.cloud.init`，混元生文见首页「延展漫谈」 |
| 网络 | 天气使用 Open-Meteo，需在公众平台配置 request 合法域名 `https://api.open-meteo.com` |
| 地图 | `wx.chooseLocation`：需在 `app.json` 声明 `requiredPrivateInfos`、`permission.scope.userLocation`（`desc` ≤ 30 字） |

### 目录结构（核心）

```
wx_program/
├── app.js / app.json / app.wxss
├── pages/
│   ├── index/          # 首页：灵签主流程 + 底部三入口
│   ├── personality/    # quiz / result 测验与结果
│   ├── track/            # 修行记录与同页分析摘要
│   ├── lottery/          # 独立灵签页（与首页共用 lottery-core）
│   └── profile/          # 个人档案
├── utils/
│   ├── personality.js    # 36 题 + 十六型 + calculatePersonality
│   ├── fortune.js        # 签运种子 buildFortuneMeta
│   ├── lottery-core.js   # 摇签、出签、缓存、画布
│   ├── lottery-advice.js # 建议列表决策与抽样
│   ├── lots.js / lots-data.js  # 64 签文案与等第映射
│   ├── almanac.js        # 节气、建除、宜忌（本地表）
│   ├── weather.js        # Open-Meteo 当前天气
│   ├── lot-art.js        # 签图 Canvas 绘制（按等第配色）
│   ├── lot-display.js    # 释义展示偏好（简/详/白话分行等）
│   ├── profile-lottery.js    # 抽签前档案是否「完整」
│   ├── analysis.js       # 修行记录分析
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

## 三、今日灵签：全流程逻辑

灵签业务集中在 **`utils/lottery-core.js`**，首页与 `pages/lottery` 共用同一套本地缓存 **`lotteryToday_v2`**。

### 3.1 用户操作路径（首页）

1. **未抽签**：展示入口；若个人档案未满足「签运增强」四项（见下），可选提示去完善或「继续抽签」。
2. **摇签**：依赖加速度计累计有效摇动次数，达标后调用 `drawLot`；模拟器可用「模拟摇动」。
3. **出签动画**：短暂 `anim` 后进入 `result`；结果写入当日缓存。
4. **揭签**：用户点击后 `revealed=true`，绘制签图 Canvas，展示诗、释义、建议列表。
5. **混元延展漫谈**：在 `index.js` 内联调用 `wx.cloud.extend.AI` 流式接口（需已 `wx.cloud.init`）。
6. **重新抽签**：清除当日缓存回到入口（逻辑在同日内重新抽）。

### 3.2 签号（lotId）如何决定：`buildFortuneMeta`

**目标**：在「同一微信用户、同一自然日、同一套档案与外部环境」下 **`lotId ∈ [0,63]` 稳定**；改档案、改日、改天气等会改变结果。

实现要点（`utils/fortune.js`）：

1. 取本地日期 **`dateStr = Y-M-D`**，计算当日 **干支** `gz`、**日五行** `wxDay`（相对 2000-01-01 的日序推算）。
2. 读取 **人格**：若已完成测验，带 `personalityTypeId` 与 `hasPersonality`；否则用占位。
3. 读取 **档案**：`age`、`gender`、`birthMonth`；**经纬度**仅来自档案中选点，**不调用自动定位**；无则参与哈希的坐标为 0。
4. **黄历包**（`utils/almanac.js`）：`jieqi`（节气表 2024–2030 等）、`jianchu`（建除十二神，与干支推算相关）。
5. **天气**：有坐标则请求 Open-Meteo，取 **WMO weathercode** 写入种子；失败则为 `na`。
6. **签运增强字段**（档案）：`recentState`（低/中/高）、`rhythmType`（早起/夜猫/不规律）、`focusTags`（多选标签排序后拼接）、`lotStylePref`（简/详/文言感/白话分行）。
7. **娱乐映射**：`ziweiHint`（由出生月与当前月衍生的宫位下标）、`bagua`（八卦之一，与 typeId/日干等相关）。
8. 将上述字段拼成 **单一字符串**，经 **FNV-1a 风格 `hashStr`** 得到 32 位无符号整数，**`lotId = hash % 64`**。

**不向用户展示**上述拼接串与中间参量（解签页只展示文化向文案）。

### 3.3 64 签与「等第」

- 文案数据源：`utils/lots-data.js`（按签序号引用）。
- **等第由 `lotId` 区间决定**，与哈希无关的「随机档」分离，保证分布固定：

| 等第 | lotId 区间（含头不含尾） | 数量 |
|------|--------------------------|------|
| 上上 | [0, 8)   | 8 |
| 上   | [8, 24)  | 16 |
| 中   | [24, 48) | 24 |
| 下   | [48, 58) | 10 |
| 下下 | [58, 64) | 6 |

实现：`utils/lots.js` 中 `tierForId`。

### 3.4 释义展示偏好：`lot-display.js`

根据档案 **`lotStylePref`** 对 `interpret` 做纯展示层处理（不改变 `lotId`）：如 **简练**取首句、**白话分行**在标点处换行等。出签当日会把 **`lotStylePref` 写入缓存**，避免次日恢复时因改偏好而错位。

### 3.5 建议列表：`lottery-advice.js`

- 根据 **等第、建除、节气季节、天气特征、年龄段、性别、人格四维阈值** 等，从多条候选 **tagged 建议**中构造池子。
- 用 **`hashStr(dateStr|lotId|tier|…|人格键|近期状态|作息|关注标签)`** 作为种子，**`mulberry32`** 打乱后 **去重抽取** 约 7 条，展示为编号列表。
- 文案设计为 **陈述式建议**，避免暴露「因你是某型所以…」的推断口吻。

### 3.6 签图 Canvas：`lot-art.js`

- 使用旧版 **`wx.createCanvasContext` + `canvas-id`**（避免 2d Canvas 部分机型黑屏）。
- 背景与装饰色由 **`lot.tier`** 分档：**上上金、上红、中蓝、下灰、下下黑**（深底+可读文字与描边）。
- `lottery-core.js` 的 `paintLotToCanvas` 传入 `id/title/tierLabel/tier`。

### 3.7 抽签前档案完整性：`profile-lottery.js`

以下**全部满足**时，首页不再弹出「是否去完善档案」：

- `recentState ∈ { low, mid, high }`
- `rhythmType ∈ { early, night, irregular }`
- `lotStylePref ∈ { brief, rich, classical, plain }`
- `focusTags` 为非空数组，且至少一项属于 `work/relation/health/study/finance/family/rest`

> **`wx.showModal` 的 `confirmText` / `cancelText` 各 ≤ 4 个汉字**，否则部分客户端会静默失败。

---

## 四、量化修行记录与分析

- 存储键：**`trackRecords_v1`**，结构为日记数组（字段以 `pages/track/track.js` 为准：如睡眠时长、生气次数、屏幕时间、步行、静坐等）。
- **`utils/analysis.js`**：对**最近至多 7 条**做简单平均与规则文案，生成「修行侧重点」类说明，**非医疗诊断**。

---

## 五、个人档案（`userProfile_v2`）

除年龄、性别、出生月、地图选点（经纬度与名称）外，可选填 **签运增强** 字段（见第三节），用于：

- 参与 **`buildFortuneMeta` 哈希**；
- 参与 **`lottery-advice`** 候选与抽样种子；
- 控制 **释义排版**（`lotStylePref`）。

---

## 六、本地存储键一览

| 键名常量 | 含义 |
|----------|------|
| `PERSONALITY_RESULT` | 道性测验最新结果 |
| `TRACK_RECORDS` | 修行记录列表 |
| `LOTTERY_TODAY` | 当日灵签缓存（lotId、revealed、adviceList、lotStylePref 等） |
| `USER_PROFILE` | 个人档案与签运增强 |

隔离说明见 `storage-keys.js` 文件头注释（按微信账号沙箱，非服务端用户 id）。

---

## 七、云开发与混元（可选）

- 环境 ID 配置：`utils/cloud-env.js`（与小程序控制台云开发环境一致）。
- `app.json` 需 **`"cloud": true`**，`app.js` 中 **`wx.cloud.init`**。
- 首页揭签后的 **「混元 · 延展漫谈」** 在 **`pages/index/index.js` 内联**流式调用 `hunyuan-exp` / `hunyuan-turbos-latest`（避免子模块未打入分包的问题）。
- 正式上线若含 **AI 生成内容展示**，需自行确认 **类目、深度合成/算法备案** 等合规要求。

---

## 八、开发与发布提示

1. 用微信开发者工具打开 **`wx_program`** 目录（或你的 miniprogramRoot）。
2. 填写与后台一致的 **AppID**；开通云开发后替换 **`cloud-env.js`** 中的环境 ID。
3. **合法域名**：配置 Open-Meteo；云开发 AI 走微信侧能力，按官方文档勾选权限。
4. **`permission.scope.userLocation.desc`** 不超过 **30 字**（否则上传代码报错 80058）。
5. 发布流程见[微信文档：小程序协同工作与发布](https://developers.weixin.qq.com/miniprogram/dev/framework/quickstart/release.html)。

---

## 九、版本与维护

- 签文与算法调整时，建议同步更新 **`lots-data.js` / `fortune.js` / `lottery-advice.js`** 的注释与本文档「第三节」描述。
- 若增加服务端同步，需在存储层引入 **用户唯一标识**（如 openid）并迁移读写逻辑，本文档「用户隔离」一节需改写。

---

*文档与当前仓库代码同步撰写；如有功能变更请以源码为准。*
