import Phaser from 'phaser';
import { assetManifest } from '../../game/assets/manifest';
import {
  cards,
  COLLECTION_GOAL,
  tasks,
  treats,
  WEEK_COUNT,
  WEEKLY_ALLOWANCE,
} from '../../game/content/economy';
import { Campaign, type WeekRecord } from '../../game/simulation/systems/Campaign';

type Screen = 'start' | 'week' | 'recap' | 'final';

const COLORS = {
  background: '#e3eee7',
  ink: '#29404a',
  muted: '#6d8588',
  greenDark: '#27745e',
  pale: 0xf8faf4,
  white: 0xffffff,
  mint: 0xe8f3ec,
  border: 0xd7e5dc,
  greenFill: 0x318e73,
};

const money = (amount: number): string => 'NT$' + amount;
const signedMoney = (amount: number): string =>
  (amount >= 0 ? '+' : '−') + money(Math.abs(amount));

export default class GameScene extends Phaser.Scene {
  private screen: Screen = 'start';
  private initialPlan = 50;
  private campaign: Campaign | null = null;

  constructor() {
    super('GameScene');
  }

  preload() {
    for (const [key, url] of Object.entries(assetManifest.images.characters)) {
      this.load.image(key, url);
    }
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.input.topOnly = true;
    this.scale.on('resize', this.renderScreen, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.renderScreen, this);
    });
    this.renderScreen();
  }

  private get portrait(): boolean {
    return this.scale.width < this.scale.height;
  }

  private renderScreen() {
    this.children.removeAll(true);
    if (this.screen === 'start') this.drawStart();
    if (this.screen === 'week') this.drawWeek();
    if (this.screen === 'recap') this.drawRecap();
    if (this.screen === 'final') this.drawFinal();
  }

  private box(
    x: number,
    y: number,
    width: number,
    height: number,
    fill: number,
    radius = 16,
    stroke?: number,
  ): Phaser.GameObjects.Graphics {
    const shape = this.add.graphics();
    shape.fillStyle(fill, 1).fillRoundedRect(x, y, width, height, radius);
    if (stroke !== undefined) {
      shape.lineStyle(2, stroke, 1).strokeRoundedRect(x, y, width, height, radius);
    }
    return shape;
  }

  private label(
    x: number,
    y: number,
    value: string,
    size = 20,
    color = COLORS.ink,
    bold = false,
    wrapWidth?: number,
  ): Phaser.GameObjects.Text {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"PingFang TC", "Microsoft JhengHei", system-ui, sans-serif',
      fontSize: (this.portrait ? Math.max(size, 22) : size) + 'px',
      color,
      fontStyle: bold ? 'bold' : 'normal',
      lineSpacing: 5,
    };
    if (wrapWidth) style.wordWrap = { width: wrapWidth, useAdvancedWrap: true };
    return this.add.text(x, y, value, style);
  }

  private centered(
    x: number,
    y: number,
    value: string,
    size = 20,
    color = COLORS.ink,
    bold = false,
  ): Phaser.GameObjects.Text {
    return this.label(x, y, value, size, color, bold).setOrigin(0.5);
  }

  private button(
    x: number,
    y: number,
    width: number,
    height: number,
    value: string,
    action: () => void,
    options: { selected?: boolean; primary?: boolean; disabled?: boolean; size?: number } = {},
  ) {
    const fill = options.primary ? COLORS.greenFill : options.selected ? COLORS.mint : COLORS.white;
    const shape = this.box(
      x,
      y,
      width,
      height,
      fill,
      options.primary ? 15 : 13,
      options.selected ? COLORS.greenFill : options.primary ? undefined : COLORS.border,
    );
    const text = this.centered(
      x + width / 2,
      y + height / 2,
      value,
      options.size ?? 21,
      options.primary ? '#ffffff' : options.disabled ? '#b2c1ba' : COLORS.ink,
      true,
    );
    if (options.disabled) {
      shape.setAlpha(0.58);
      return;
    }
    const hitWidth = this.portrait ? Math.max(width, 80) : width;
    const hitHeight = this.portrait ? Math.max(height, 80) : height;
    const zone = this.add.zone(x + width / 2, y + height / 2, hitWidth, hitHeight)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      shape.setAlpha(0.84);
      text.setAlpha(0.9);
    });
    zone.on('pointerout', () => {
      shape.setAlpha(1);
      text.setAlpha(1);
    });
    zone.on('pointerup', () => {
      action();
      this.renderScreen();
    });
  }

  private panel(x: number, y: number, width: number, height: number) {
    const shadow = this.box(x, y + 10, width, height, 0xbacfc2, 24);
    shadow.setAlpha(0.25);
    this.box(x, y, width, height, COLORS.pale, 24);
  }

  private goalPill(x: number, y: number, width: number, text = '目標 ' + money(COLLECTION_GOAL)) {
    this.box(x, y, width, 46, 0xdcefe5, 24);
    this.centered(x + width / 2, y + 23, text, 19, COLORS.ink, true);
  }

  private animalCard(
    x: number,
    y: number,
    width: number,
    height: number,
    card: (typeof cards)[number],
    options: { muted?: boolean; compact?: boolean } = {},
  ) {
    this.box(x, y, width, height, COLORS.white, 16, COLORS.border);
    const imageSize = options.compact ? 58 : this.portrait ? 106 : 88;
    const imageY = y + (options.compact ? 38 : this.portrait ? 67 : 62);
    const image = this.add.image(x + width / 2, imageY, card.id);
    const scale = Math.min(imageSize / image.width, imageSize / image.height);
    image.setScale(scale);
    if (options.muted) image.setAlpha(0.33);
    const nameY = y + (options.compact ? height - 20 : this.portrait ? 139 : 121);
    this.centered(x + width / 2, nameY, card.name, options.compact ? 16 : 19, COLORS.ink, true);
    if (!options.compact) {
      this.centered(x + width / 2, y + height - 27, money(card.price), 16, COLORS.muted, true);
    }
  }

  private drawStart() {
    const tall = this.portrait;
    const panel = tall
      ? { x: 24, y: 24, width: 672, height: 1132 }
      : { x: 64, y: 42, width: 1152, height: 636 };
    this.panel(panel.x, panel.y, panel.width, panel.height);

    const left = tall ? 52 : 104;
    this.label(left, tall ? 58 : 77, '園遊會卡片收藏家', tall ? 33 : 32, COLORS.ink, true);
    this.label(left, tall ? 104 : 118, '六週後的園遊會，想收齊這一套動物卡片嗎？', tall ? 20 : 19, COLORS.muted);
    this.goalPill(tall ? 494 : 965, tall ? 143 : 78, tall ? 172 : 190);
    this.label(left, tall ? 158 : 168, '園遊會限定卡片', 21, COLORS.ink, true);

    if (tall) {
      cards.forEach((card, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        this.animalCard(52 + col * 208, 202 + row * 210, 198, 194, card);
      });
    } else {
      cards.forEach((card, index) => this.animalCard(104 + index * 179, 202, 164, 185, card));
    }

    const planY = tall ? 650 : 407;
    const planX = left;
    const planW = tall ? 616 : 1072;
    const planH = tall ? 218 : 131;
    this.box(planX, planY, planW, planH, COLORS.mint, 18);
    this.label(planX + 24, planY + 19, '先訂一個起始計畫', 22, COLORS.ink, true);
    this.label(planX + 24, planY + 51, '平均每週存款', 17, COLORS.muted);
    const controlY = planY + 79;
    this.button(planX + 24, controlY, 53, 48, '−', () => {
      this.initialPlan = Math.max(0, this.initialPlan - 5);
    }, { disabled: this.initialPlan <= 0, size: 27 });
    this.centered(planX + 156, controlY + 24, money(this.initialPlan), 25, COLORS.ink, true);
    this.button(planX + 232, controlY, 53, 48, '+', () => {
      this.initialPlan = Math.min(100, this.initialPlan + 5);
    }, { disabled: this.initialPlan >= 100, size: 27 });

    const estimate = this.initialPlan * WEEK_COUNT;
    const difference = estimate - COLLECTION_GOAL;
    const comparison = difference > 0
      ? '比目標多 ' + money(difference)
      : difference < 0
        ? '比目標少 ' + money(-difference)
        : '剛好達到目標';
    const detailX = tall ? planX + 24 : planX + 440;
    const detailY = tall ? planY + 143 : planY + 22;
    this.label(detailX, detailY, '六週預計 ' + money(estimate) + '，' + comparison + '。', 19, COLORS.ink, true);
    this.label(detailX, detailY + 31, '固定零用錢每週 NT$30；可選任務增加收入。', 16, COLORS.muted);
    if (!tall) {
      this.label(detailX, detailY + 57, '每週先看事件；未花的錢留在錢包帶到下週。', 16, COLORS.muted);
    }

    const buttonY = tall ? 933 : 568;
    const buttonW = tall ? 488 : 390;
    const buttonX = (this.scale.width - buttonW) / 2;
    this.button(buttonX, buttonY, buttonW, tall ? 72 : 58, '開始六週挑戰', () => {
      this.campaign = new Campaign(this.initialPlan);
      this.screen = 'week';
    }, { primary: true, size: tall ? 24 : 21 });
    this.centered(
      this.scale.width / 2,
      tall ? 1034 : 650,
      '選任務、安排存款，看看你的計畫能否達標。',
      16,
      COLORS.muted,
    );
  }

  private drawTask(
    x: number,
    y: number,
    width: number,
    height: number,
    task: (typeof tasks)[number],
    campaign: Campaign,
  ) {
    const selected = campaign.selectedTask === task.id;
    const enabled = campaign.canChooseTask(task.id);
    const background = this.box(x, y, width, height, selected ? COLORS.mint : COLORS.white, 14, selected ? COLORS.greenFill : COLORS.border);
    this.label(x + 16, y + 12, task.name, this.portrait ? 20 : 19, COLORS.ink, true);
    this.label(x + 16, y + 40, task.description, 15, COLORS.muted);
    if (this.portrait) {
      this.label(x + 318, y + 13, '報酬 ' + money(task.reward) + '　材料 ' + money(task.cost), 15, COLORS.greenDark, true);
      this.label(x + 318, y + 42, '淨得 ' + money(task.reward - task.cost), 15, COLORS.greenDark, true);
    } else {
      const info = '報酬 ' + money(task.reward) + '　材料 ' + money(task.cost) + '　淨得 ' + money(task.reward - task.cost);
      this.label(x + 16, y + height - 27, info, 15, COLORS.greenDark, true);
    }
    if (!enabled) {
      background.setAlpha(0.5);
      return;
    }
    const zone = this.add.zone(x + width / 2, y + height / 2, width, this.portrait ? Math.max(height, 80) : height)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => background.setAlpha(0.82));
    zone.on('pointerout', () => background.setAlpha(1));
    zone.on('pointerup', () => {
      campaign.chooseTask(task.id);
      this.renderScreen();
    });
  }

  private drawWeek() {
    const campaign = this.campaign;
    if (!campaign) return;
    const tall = this.portrait;
    this.panel(tall ? 24 : 64, tall ? 24 : 32, tall ? 672 : 1152, tall ? 1132 : 656);
    const left = tall ? 52 : 102;
    this.label(left, tall ? 53 : 55, '第 ' + campaign.week + ' 週', tall ? 32 : 30, COLORS.ink, true);
    this.label(left, tall ? 96 : 93, '六週挑戰　・　事件先揭露，再安排本週用錢', 17, COLORS.muted);

    if (tall) {
      this.goalPill(52, 131, 275, '收藏基金 ' + money(campaign.fund));
      this.goalPill(346, 131, 275, '錢包 ' + money(campaign.wallet));
    } else {
      this.goalPill(717, 57, 220, '基金 ' + money(campaign.fund) + ' / ' + money(COLLECTION_GOAL));
      this.goalPill(950, 57, 220, '錢包 ' + money(campaign.wallet));
    }

    const eventX = left;
    const eventY = tall ? 198 : 130;
    const eventW = tall ? 616 : 1068;
    const eventH = tall ? 116 : 76;
    this.box(eventX, eventY, eventW, eventH, COLORS.mint, 16);
    this.label(eventX + 20, eventY + 14, '本週事件｜' + campaign.event.title, 20, COLORS.ink, true);
    this.label(eventX + 20, eventY + 45, campaign.event.description, tall ? 18 : 17, COLORS.muted, false, eventW - 38);
    if (!tall) {
      this.centered(eventX + eventW - 95, eventY + 28, signedMoney(campaign.event.delta), 18, COLORS.greenDark, true);
    }

    const taskHeadingY = tall ? 337 : 226;
    this.label(left, taskHeadingY, '選一項任務', 21, COLORS.ink, true);
    this.label(left + 145, taskHeadingY + 2, '比較報酬與材料費', 16, COLORS.muted);
    if (tall) {
      tasks.forEach((task, index) => this.drawTask(left, 370 + index * 86, 616, 78, task, campaign));
    } else {
      tasks.forEach((task, index) => this.drawTask(left + index * 361, 258, 346, 106, task, campaign));
    }

    const treatHeadingY = tall ? 640 : 388;
    this.label(left, treatHeadingY, '點心與飲料', 21, COLORS.ink, true);
    this.label(left + 143, treatHeadingY + 3, '想享受一下，也可以選擇先不買', 16, COLORS.muted);
    const treatY = tall ? 672 : 421;
    const treatW = tall ? 194 : 155;
    const treatGap = tall ? 17 : 13;
    treats.forEach((treat, index) => {
      const text = treat.name + '\n' + money(treat.price);
      this.button(left + index * (treatW + treatGap), treatY, treatW, tall ? 68 : 62, text, () => {
        campaign.chooseTreat(treat.id);
      }, {
        selected: campaign.selectedTreat === treat.id,
        disabled: treat.price > campaign.moneyBeforeTreat,
        size: 17,
      });
    });

    const budgetX = tall ? left : 620;
    const budgetY = tall ? 767 : 386;
    const budgetW = tall ? 616 : 550;
    const budgetH = tall ? 207 : 167;
    this.box(budgetX, budgetY, budgetW, budgetH, COLORS.mint, 17);
    this.label(budgetX + 20, budgetY + 14, '可分配給存款和錢包 ' + money(campaign.available), 20, COLORS.ink, true);
    const calculation = money(campaign.wallet) + ' + ' + money(WEEKLY_ALLOWANCE) + ' ' +
      signedMoney(campaign.event.delta) + ' + ' + money(campaign.task.reward) + ' − ' +
      money(campaign.task.cost) + ' − ' + money(campaign.treat.price);
    this.label(budgetX + 20, budgetY + 44, calculation, tall ? 18 : 16, COLORS.muted);
    this.label(budgetX + 20, budgetY + 75, '存入收藏基金', 17, COLORS.ink, true);
    const controlY = budgetY + 105;
    this.button(budgetX + 20, controlY, 48, 45, '−', () => campaign.adjustSavings(-5), {
      disabled: campaign.savings === 0,
      size: 25,
    });
    this.centered(budgetX + 136, controlY + 22, money(campaign.savings), 23, COLORS.ink, true);
    this.button(budgetX + 206, controlY, 48, 45, '+', () => campaign.adjustSavings(5), {
      disabled: campaign.savings >= Math.floor(campaign.available / 5) * 5,
      size: 25,
    });
    this.label(budgetX + (tall ? 320 : 290), controlY + 5, '留在錢包', 16, COLORS.muted);
    this.label(budgetX + (tall ? 320 : 290), controlY + 27, money(campaign.walletAfter), 21, COLORS.ink, true);
    if (tall) {
      this.label(budgetX + 20, budgetY + 170, '錢包餘額會帶到下一週。', 16, COLORS.muted);
    }

    if (tall) {
      this.label(left, 995, '原先計畫每週存 ' + money(campaign.weeklyPlan) + '，可依本週狀況調整。', 16, COLORS.muted);
      this.button(96, 1037, 528, 69, '確認本週安排', () => {
        if (campaign.settleWeek()) this.screen = 'recap';
      }, { primary: true, size: 23 });
    } else {
      this.label(left, 571, '原先計畫每週存 ' + money(campaign.weeklyPlan) + '；未花的錢會留在錢包。', 17, COLORS.muted);
      this.button(851, 611, 319, 57, '確認本週安排', () => {
        if (campaign.settleWeek()) this.screen = 'recap';
      }, { primary: true });
    }
  }

  private progressBar(x: number, y: number, width: number, value: number) {
    this.box(x, y, width, 18, 0xdbe8df, 9);
    const progress = Math.max(0, Math.min(1, value / COLLECTION_GOAL));
    if (progress > 0) this.box(x, y, Math.max(18, width * progress), 18, COLORS.greenFill, 9);
  }

  private drawRecap() {
    const campaign = this.campaign;
    const record = campaign?.records[campaign.records.length - 1];
    if (!campaign || !record) return;
    const tall = this.portrait;
    const x = tall ? 24 : 100;
    const y = tall ? 24 : 65;
    const width = tall ? 672 : 1080;
    const height = tall ? 1132 : 590;
    this.panel(x, y, width, height);
    const left = x + (tall ? 30 : 44);
    this.label(left, y + 34, '第 ' + record.week + ' 週結算', tall ? 34 : 31, COLORS.ink, true);
    this.label(left, y + 79, record.week < WEEK_COUNT ? '先看看這週的選擇，下一週再調整。' : '先看看最後一週的安排，再查看六週結果。', 18, COLORS.muted);

    const statY = y + (tall ? 139 : 130);
    const statW = tall ? 190 : 288;
    const statGap = tall ? 17 : 18;
    const stats = [
      { title: '本週存入基金', value: money(record.saved) },
      { title: '留在錢包', value: money(record.walletAfter) },
      { title: '基金累積', value: money(record.fundAfter) },
    ];
    stats.forEach((stat, index) => {
      const sx = left + index * (statW + statGap);
      this.box(sx, statY, statW, tall ? 112 : 100, COLORS.mint, 16);
      this.label(sx + 16, statY + 17, stat.title, 16, COLORS.muted);
      this.label(sx + 16, statY + 49, stat.value, tall ? 27 : 28, COLORS.ink, true);
    });

    const progressY = y + (tall ? 304 : 258);
    this.label(left, progressY, '收藏目標進度', 20, COLORS.ink, true);
    this.label(left, progressY + 31, money(campaign.fund) + ' / ' + money(COLLECTION_GOAL), 17, COLORS.muted);
    this.progressBar(left, progressY + 63, tall ? 607 : 990, campaign.fund);
    const remainingWeeks = WEEK_COUNT - campaign.week;
    let reminder = campaign.gap === 0 ? '已達到收藏目標！' : '還差 ' + money(campaign.gap) + '。';
    if (campaign.gap > 0 && remainingWeeks > 0) {
      reminder += ' 剩下 ' + remainingWeeks + ' 週，平均每週約需存 ' +
        money(Math.ceil(campaign.gap / remainingWeeks)) + '。';
    }
    this.label(left, progressY + 100, reminder, tall ? 19 : 18, COLORS.greenDark, true, tall ? 590 : 940);

    const explainY = y + (tall ? 516 : 407);
    this.box(left, explainY, tall ? 607 : 990, tall ? 235 : 78, 0xffffff, 14, COLORS.border);
    const lineOne = '任務報酬 ' + money(record.taskReward) + ' − 材料費 ' + money(record.taskCost) +
      '；事件影響 ' + signedMoney(record.eventDelta) + '。';
    const lineTwo = '點心飲料 ' + money(record.treatCost) + '；存入基金後，' +
      money(record.walletAfter) + (record.week < WEEK_COUNT ? ' 留到下一週。' : ' 留在錢包。');
    this.label(left + 18, explainY + 13, lineOne, tall ? 19 : 17, COLORS.ink, false, tall ? 570 : 950);
    this.label(left + 18, explainY + (tall ? 79 : 43), lineTwo, tall ? 19 : 17, COLORS.muted, false, tall ? 570 : 950);
    if (tall) {
      this.label(left + 18, explainY + 151, '想一想：這週什麼選擇影響了存款？', 18, COLORS.greenDark, true, 560);
    }

    const buttonWidth = tall ? 490 : 330;
    const buttonX = (this.scale.width - buttonWidth) / 2;
    const buttonY = tall ? 1013 : 579;
    this.button(buttonX, buttonY, buttonWidth, tall ? 70 : 55, record.week < WEEK_COUNT ? '進入下一週' : '查看六週結果', () => {
      if (record.week < WEEK_COUNT) {
        if (campaign.advanceWeek()) this.screen = 'week';
      } else {
        this.screen = 'final';
      }
    }, { primary: true, size: tall ? 23 : 20 });
  }

  private drawHistoryRow(x: number, y: number, width: number, record: WeekRecord, tall: boolean) {
    this.box(x, y, width, tall ? 51 : 32, COLORS.white, 9);
    const event = record.eventDelta === 0 ? '±NT$0' : signedMoney(record.eventDelta);
    if (tall) {
      const eventValue = record.eventDelta === 0 ? '±0' :
        (record.eventDelta > 0 ? '+' : '−') + Math.abs(record.eventDelta);
      const first = '第' + record.week + '週　' + record.eventTitle + ' ' + eventValue;
      const second = record.taskName + ' 淨' + (record.taskReward - record.taskCost) +
        '　點心' + record.treatCost + '　存款' + record.saved + '　錢包' + record.walletAfter;
      this.label(x + 12, y + 2, first + '\n' + second, 16, COLORS.ink, false, width - 24);
    } else {
      const line = '第 ' + record.week + ' 週　' + record.eventTitle + ' ' + event + '　' +
        record.taskName + ' 淨得 ' + money(record.taskReward - record.taskCost) +
        '　點心 ' + money(record.treatCost) + '　存款 ' + money(record.saved) +
        '　錢包 ' + money(record.walletAfter);
      this.label(x + 12, y + 7, line, 14, COLORS.ink, false, width - 24);
    }
  }

  private drawFinal() {
    const campaign = this.campaign;
    if (!campaign) return;
    const tall = this.portrait;
    const x = tall ? 24 : 64;
    const y = tall ? 24 : 32;
    const width = tall ? 672 : 1152;
    const height = tall ? 1132 : 656;
    this.panel(x, y, width, height);
    const left = x + (tall ? 28 : 38);
    const won = campaign.fund >= COLLECTION_GOAL;
    this.label(left, y + 28, won ? '恭喜，收齊動物卡！' : '這次還差 ' + money(campaign.gap), tall ? 32 : 30, COLORS.ink, true);
    const outcome = won
      ? '基金累積 ' + money(campaign.fund) + '，兌換卡片後剩下 ' + money(campaign.fund - COLLECTION_GOAL) + '。'
      : '六週共存入 ' + money(campaign.fund) + '，回顧每週安排，再試一次。';
    this.label(left, y + 71, outcome, 18, COLORS.muted, false, tall ? 610 : 1000);

    if (tall) {
      cards.forEach((card, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        this.animalCard(left + col * 205, y + 130 + row * 119, 190, 108, card, { muted: !won, compact: true });
      });
    } else {
      cards.forEach((card, index) => this.animalCard(left + index * 177, y + 120, 162, 108, card, { muted: !won, compact: true }));
    }

    const treatsSpent = campaign.records.reduce((sum, record) => sum + record.treatCost, 0);
    const summaryY = y + (tall ? 382 : 246);
    const summaryW = tall ? 612 : 1076;
    this.box(left, summaryY, summaryW, tall ? 92 : 72, COLORS.mint, 15);
    this.label(left + 16, summaryY + 14, '基金累積 ' + money(campaign.fund), tall ? 19 : 18, COLORS.ink, true);
    this.label(left + (tall ? 220 : 355), summaryY + 14, '點心飲料 ' + money(treatsSpent), tall ? 19 : 18, COLORS.ink, true);
    this.label(left + (tall ? 16 : 710), summaryY + (tall ? 50 : 14), '錢包剩餘 ' + money(campaign.wallet), tall ? 19 : 18, COLORS.ink, true);
    this.label(left + (tall ? 220 : 16), summaryY + (tall ? 51 : 44), '起始計畫 ' + money(campaign.weeklyPlan) + '／週', 15, COLORS.muted);

    const historyY = y + (tall ? 497 : 336);
    this.label(left, historyY, tall ? '六週決策紀錄（單位：NT$）' : '六週決策紀錄', 20, COLORS.ink, true);
    const rowY = historyY + 34;
    campaign.records.forEach((record, index) => {
      this.drawHistoryRow(left, rowY + index * (tall ? 58 : 37), summaryW, record, tall);
    });

    const reflectionY = y + (tall ? 906 : 604);
    this.label(left, reflectionY, '想一想：哪一次選擇影響了你的存款？為什麼？', tall ? 18 : 16, COLORS.muted, false, tall ? 600 : 680);
    this.button(
      tall ? 109 : 889,
      tall ? y + 1000 : y + 588,
      tall ? 502 : 250,
      tall ? 66 : 50,
      '重新挑戰',
      () => {
        this.campaign = null;
        this.screen = 'start';
      },
      { primary: true, size: tall ? 22 : 19 },
    );
  }
}
