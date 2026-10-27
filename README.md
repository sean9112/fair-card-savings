# 園遊會卡片收藏家

一款給國小高年級玩家的六週儲蓄規劃遊戲。玩家比較任務報酬與材料費，因應每週事件，在點心消費、收藏基金和錢包餘額之間做選擇，並在結束時回顧自己的決策。

遊戲使用 Phaser 4、TypeScript 和 Vite。六張動物卡合計 NT$290；目前數值屬於 MVP 試玩假設。

## 開始遊玩

[開啟 GitHub Pages 遊戲](https://sean9112.github.io/fair-card-savings/)

## 本機開發

需要 Node.js 22.12 以上與 npm：

    npm ci
    npm run dev

依照終端機顯示的網址開啟遊戲。執行正式建置：

    npm run build

推送至 main 後，GitHub Actions 會建置並部署 GitHub Pages。

## 素材與企劃

動物圖使用 Kenney 的 Animal Pack Remastered，授權為 CC0；來源及授權紀錄見[素材清單](docs/assets.md)。玩法、學習目標和後續迭代方向見[遊戲企劃書](docs/game-design.md)。
