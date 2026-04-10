# 箴言配图隶书字体

将心象箴言配图上的卦名与副标题显示为隶书时，需在**本目录**放置字体文件。程序会按顺序尝试下列**任一**文件名（命中即停）：

1. `LiShu.otf`
2. `LiShu.ttf`
3. `AlimamaDaoLiTi-Regular.otf`（阿里妈妈刀隶体解压后的默认名）
4. `FandolLi-Regular.otf`（若你自行持有该文件）

## 推荐：阿里妈妈刀隶体

- 获取：<https://fonts.alibabagroup.com/> 或 <https://www.alibabafonts.com/> 字体列表中的「阿里妈妈刀隶体」
- 许可：以官方页面为准；一般允许免费商用，请自行确认最新条款。
- 放置：将得到的 `AlimamaDaoLiTi-Regular.otf` 复制到 `wx_program/fonts/`，或改名为 `LiShu.otf` 放入同目录。

## 关于「Fandol 隶书」

CTAN 上的官方 [fandol](https://ctan.org/pkg/fandol) 包仅含宋、黑、楷、仿等，**不包含**名为 FandolLi 的文件；若网上另有同名文件，请自行核对来源与授权后再使用。

若未放置任何上述文件，配图文字将回退为系统默认字体。

配图卦名与副标题使用页面上的 **cover-view** 叠在原生 canvas 之上显示（真机上旧版 canvas 无法可靠使用 `loadFontFace` 字体）。
