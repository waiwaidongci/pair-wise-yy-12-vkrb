import type { HoofKey } from "./types";

export const STORAGE_KEY = "farrier-archive-v1";

export const HOOF_KEYS: HoofKey[] = ["LF", "RF", "LH", "RH"];

export const HOOF_LABELS: Record<HoofKey, string> = {
  LF: "左前",
  RF: "右前",
  LH: "左后",
  RH: "右后",
};

export const HORSE_CATEGORIES = ["运动马", "休养马"] as const;

export const SHOE_TYPES = [
  "普通铁蹄铁",
  "铝蹄铁",
  "加护蹄垫",
  "防滑钉蹄铁",
  "矫正蹄铁",
  "无铁（裸蹄修整）",
];

export const HOOF_CONDITIONS = [
  "正常",
  "裂蹄",
  "外侧磨耗",
  "内侧磨耗",
  "蹄底瘀伤",
  "蹄叉腐烂",
  "蹄壁缺损",
  "感染迹象",
];

export const NAIL_PRESETS = [
  "标准4钉",
  "外侧前置4钉",
  "内侧后置4钉",
  "6钉加固",
  "免钉（粘蹄铁）",
];

/** 判定步态问题是否需要异常标记的关键词 */
export const ABNORMAL_KEYWORDS = ["不稳", "跛", "异常", "外伤", "感染", "烂", "瘀伤", "裂纹", "裂蹄"];

export const UPCOMING_DAYS = 7;
