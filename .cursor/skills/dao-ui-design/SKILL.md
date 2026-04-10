---
name: dao-ui-design
description: >-
  Applies the wx_program "紫金墨" UI system for 玄学/道教高级感: tokens in app.wxss,
  typography, cards, buttons, and navigation consistency. Use when editing WXML/WXSS
  in wx_program, adding pages, or when the user asks for styling, themes, colors, or
  visual polish for this mini program.
---

# 道性小程序 UI 技能（紫金墨）

## 必读

实现或修改界面前，阅读仓库 **`docs/UI_DESIGN_SYSTEM.md`**，其中含完整气质说明、禁忌、组件规范与优化清单。

## 硬性约定

1. **颜色**：优先使用 `app.wxss` 中 `page` 上定义的 **`--dao-*` CSS 变量**，勿新增随意 hex；同一语义（主紫、次紫、正文、脚注）全项目一致。
2. **卡片**：新内容块优先使用全局 class **`.card`**（或在其内嵌套），保持圆角、金边、阴影与 `UI_DESIGN_SYSTEM.md` 一致。
3. **按钮**：主操作 **`.btn-primary`**，次要 **`.btn-ghost`**；一屏仅一个主色实心主按钮，除非产品明确要求并列双主操作。
4. **字体层级**：标题 600 字重 + `--dao-purple-deep` / mid；正文 `--dao-ink`；说明与免责 `--dao-ink-muted` / `--dao-ink-faint` + 较小 rpx。
5. **气质**：留白充足；金边仅作细线/弱描边；避免高饱和彩虹渐变、大面积纯黑配荧光字。
6. **合规呈现**：医疗/命理免责声明用小字、低对比，不抢主内容。

## 工作流

- 新增页面：从 `app.json` 复制兄弟页的导航色需求；正文区用 `page` 背景色变量；首屏结构「可选顶栏 + `.card` 列表」。
- 改样式：先查是否已有全局 class；再查是否可用 `var(--dao-*)` 替换硬编码。
- 与首页自定义顶栏共存时： ritual 渐变（`--dao-ritual-purple-*`）仅用于该顶栏；内页一般用系统导航 + `--dao-purple-deep`。

## 自检（改完 diff 前快速过一遍）

- [ ] 未引入与紫金墨冲突的主色（如鲜绿主 CTA、大红主按钮）。
- [ ] 新硬编码 hex 数量为零或已在文档中登记为新令牌。
- [ ] 主按钮与免责字号、对比度符合 `UI_DESIGN_SYSTEM.md`。

## 与 README 的关系

产品逻辑与存储仍以 **`README.md`** 为准；纯视觉规范以 **`docs/UI_DESIGN_SYSTEM.md`** 与本 Skill 为准。
