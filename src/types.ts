export type HoofKey = "LF" | "RF" | "LH" | "RH";

export type HorseCategory = "运动马" | "休养马";

export interface HoofState {
  /** 蹄部评估：正常、裂蹄、磨耗异常、蹄底瘀伤、感染迹象等 */
  condition: string;
  /** 钉位：如 4 钉-外侧前置，空字符串表示未填写 */
  nailPositions: string;
}

export interface TrimRecord {
  id: string;
  /** 登记时的修蹄日期（ISO，yyyy-MM-dd） */
  date: string;
  gaitIssue: string;
  hoofEvaluation: string;
  hooves: Record<HoofKey, HoofState>;
  /** 本次换上的蹄铁类型 */
  shoeAfter: string;
  /** 换上前的蹄铁类型；同马第二次修蹄自动取上次记录 */
  shoeBefore: string;
  reviewDate: string;
  /** 复查提醒是否已处理 */
  reviewHandled: boolean;
  note: string;
  createdAt: number;
}

export interface Horse {
  id: string;
  /** 马号，大写保存，同时作为同马归并的依据 */
  horseNo: string;
  category: HorseCategory;
  records: TrimRecord[];
}

export interface ArchiveState {
  horses: Horse[];
  version: number;
}
