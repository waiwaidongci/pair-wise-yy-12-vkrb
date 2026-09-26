export type HoofKey = "LF" | "RF" | "LH" | "RH";

export type GaitLevel = "normal" | "mild" | "severe";

export interface TrimRecord {
  id: string;
  horseId: string;
  trimDate: string; // YYYY-MM-DD
  nextCheckDate: string; // YYYY-MM-DD
  gaitLevel: GaitLevel;
  gaitNote: string;
  hoofAssessment: string;
  hooves: Record<HoofKey, string>;
  shoeType: string;
  nailPattern: string;
  note: string;
  recheckDone: boolean;
  recheckDoneDate: string | null;
  createdAt: number;
}
