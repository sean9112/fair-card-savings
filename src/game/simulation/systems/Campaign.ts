import {
  COLLECTION_GOAL,
  tasks,
  treats,
  weekEvents,
  WEEK_COUNT,
  WEEKLY_ALLOWANCE,
  type TaskId,
  type TreatId,
} from '../../content/economy';

export interface WeekRecord {
  week: number;
  eventTitle: string;
  eventDelta: number;
  walletBefore: number;
  taskName: string;
  taskReward: number;
  taskCost: number;
  treatName: string;
  treatCost: number;
  available: number;
  saved: number;
  walletAfter: number;
  fundAfter: number;
}

export class Campaign {
  readonly weeklyPlan: number;
  week = 1;
  wallet = 0;
  fund = 0;
  selectedTask: TaskId = 'bags';
  selectedTreat: TreatId = 'none';
  desiredSavings: number;
  records: WeekRecord[] = [];
  settled = false;

  constructor(weeklyPlan: number) {
    this.weeklyPlan = Math.max(0, Math.round(weeklyPlan / 5) * 5);
    this.desiredSavings = this.weeklyPlan;
  }

  get event() {
    return weekEvents[this.week - 1];
  }

  get task() {
    return tasks.find((task) => task.id === this.selectedTask) ?? tasks[0];
  }

  get treat() {
    return treats.find((treat) => treat.id === this.selectedTreat) ?? treats[0];
  }

  get moneyBeforeTreat(): number {
    return Math.max(
      0,
      this.wallet + WEEKLY_ALLOWANCE + this.event.delta + this.task.reward - this.task.cost,
    );
  }

  get available(): number {
    return Math.max(0, this.moneyBeforeTreat - this.treat.price);
  }

  get savings(): number {
    return Math.min(this.desiredSavings, Math.floor(this.available / 5) * 5);
  }

  get walletAfter(): number {
    return this.available - this.savings;
  }

  get gap(): number {
    return Math.max(0, COLLECTION_GOAL - this.fund);
  }

  canChooseTask(id: TaskId): boolean {
    const task = tasks.find((candidate) => candidate.id === id);
    return !!task && this.wallet + WEEKLY_ALLOWANCE + this.event.delta >= task.cost;
  }

  chooseTask(id: TaskId): void {
    if (this.settled || !this.canChooseTask(id)) return;
    this.selectedTask = id;
    if (this.treat.price > this.moneyBeforeTreat) this.selectedTreat = 'none';
  }

  chooseTreat(id: TreatId): void {
    const treat = treats.find((candidate) => candidate.id === id);
    if (this.settled || !treat || treat.price > this.moneyBeforeTreat) return;
    this.selectedTreat = id;
  }

  adjustSavings(delta: number): void {
    if (this.settled) return;
    const maximum = Math.floor(this.available / 5) * 5;
    this.desiredSavings = Math.max(0, Math.min(maximum, this.savings + delta));
  }

  settleWeek(): WeekRecord | null {
    if (this.settled || this.records.length >= WEEK_COUNT) return null;
    const saved = this.savings;
    const record: WeekRecord = {
      week: this.week,
      eventTitle: this.event.title,
      eventDelta: this.event.delta,
      walletBefore: this.wallet,
      taskName: this.task.name,
      taskReward: this.task.reward,
      taskCost: this.task.cost,
      treatName: this.treat.name,
      treatCost: this.treat.price,
      available: this.available,
      saved,
      walletAfter: this.walletAfter,
      fundAfter: this.fund + saved,
    };
    this.wallet = record.walletAfter;
    this.fund = record.fundAfter;
    this.records.push(record);
    this.settled = true;
    return record;
  }

  advanceWeek(): boolean {
    if (!this.settled || this.week >= WEEK_COUNT) return false;
    this.week += 1;
    this.selectedTask = 'bags';
    this.selectedTreat = 'none';
    this.desiredSavings = this.weeklyPlan;
    this.settled = false;
    return true;
  }
}
