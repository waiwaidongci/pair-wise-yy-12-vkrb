import { useEffect, useState } from "react";
import "./styles.css";
import type { TrimRecord } from "./types";
import { clearRecords, loadRecords, saveRecords } from "./store";
import { computeMetrics, todayISO } from "./domain";
import MetricsBar from "./components/MetricsBar";
import RecheckPanel from "./components/RecheckPanel";
import TrimForm from "./components/TrimForm";
import HorseList from "./components/HorseList";

function App() {
  const [records, setRecords] = useState<TrimRecord[]>(loadRecords);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const addRecord = (record: TrimRecord) => {
    setRecords((prev) => [...prev, record]);
  };

  const markRecheckDone = (id: string) => {
    const today = todayISO();
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, recheckDone: true, recheckDoneDate: today } : r
      )
    );
  };

  const resetAll = () => {
    if (window.confirm("确定清空全部修蹄档案？此操作不可恢复。")) {
      clearRecords();
      setRecords([]);
    }
  };

  const metrics = computeMetrics(records);

  return (
    <main className="app">
      <section className="hero">
        <p>
          hxyfront-62011 · 蹄铁师工作台 · 今天 {todayISO()}
        </p>
        <h1>马术蹄铁修整档案</h1>
        <span>
          登记马号、步态问题、蹄形评估、四蹄状态、蹄铁类型与钉位，保存后列表立即更新。
          同一匹马的修蹄记录自动串成历史并对比换铁前后类型；复查到期会在提醒区标出，
          处理后不再催促，记录仍可随时回查。数据保存在本机浏览器，关页不丢。
        </span>
      </section>

      <MetricsBar metrics={metrics} />

      <section className="workspace">
        <RecheckPanel records={records} onMarkDone={markRecheckDone} />
        <TrimForm records={records} onAdd={addRecord} />
      </section>

      <HorseList records={records} onMarkDone={markRecheckDone} />

      <footer className="footer">
        <span>数据仅保存在当前浏览器（localStorage），关闭页面不会丢失。</span>
        <button className="danger" onClick={resetAll}>
          清空全部档案
        </button>
      </footer>
    </main>
  );
}

export default App;
