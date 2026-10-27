export const WEEK_COUNT = 6;
export const WEEKLY_ALLOWANCE = 30;

export const cards = [
  { id: 'giraffe', name: '長頸鹿', price: 35 },
  { id: 'penguin', name: '企鵝', price: 40 },
  { id: 'frog', name: '青蛙', price: 45 },
  { id: 'sloth', name: '樹懶', price: 50 },
  { id: 'elephant', name: '大象', price: 55 },
  { id: 'owl', name: '貓頭鷹', price: 65 },
] as const;

export const COLLECTION_GOAL = cards.reduce((total, card) => total + card.price, 0);

export const tasks = [
  { id: 'flyers', name: '整理園遊會傳單', description: '簡單幫忙，沒有材料費', reward: 10, cost: 0 },
  { id: 'bags', name: '製作包裝紙袋', description: '需要準備一些紙材', reward: 20, cost: 5 },
  { id: 'booth', name: '幫忙布置攤位', description: '比較忙碌，需要準備材料', reward: 25, cost: 5 },
] as const;

export const treats = [
  { id: 'none', name: '先不買', price: 0 },
  { id: 'snack', name: '買點心', price: 10 },
  { id: 'drink', name: '買飲料', price: 15 },
] as const;

export const weekEvents = [
  { title: '園遊會開始準備', description: '這週沒有額外收支，先用零用錢與任務收入安排計畫。', delta: 0 },
  { title: '整理書桌的獎勵', description: '家人給你額外的零用錢，本週收入增加 NT$10。', delta: 10 },
  { title: '卡套破掉了', description: '需要臨時購買卡套，本週支出增加 NT$10。', delta: -10 },
  { title: '幫忙找回文具', description: '同學感謝你的幫忙，本週收入增加 NT$5。', delta: 5 },
  { title: '園遊會材料費', description: '班級需要補買材料，本週支出增加 NT$5。', delta: -5 },
  { title: '回收整理獎勵', description: '完成回收整理，本週收入增加 NT$5。', delta: 5 },
] as const;

export type TaskId = (typeof tasks)[number]['id'];
export type TreatId = (typeof treats)[number]['id'];
