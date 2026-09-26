import { useEffect, useState } from "react";
import "./styles.css";
import { MetricsBar } from "./components/MetricsBar";
import { RecordForm } from "./components/RecordForm";
import { ReminderPanel } from "./components/ReminderPanel";
import { HorseList } from "./components/HorseList";
import { buildCSV } from "./lib/csv";
import { useArchive } from "./lib/useArchive";

function App() {
  const archive = useArchive();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState("");
  const [justSavedNo, setJustSavedNo] = useState<string | null>(null);

  const horseNos = archive.summaries.map((s) => s.horse.horseNo);

  // 保存后等列表更新，再展开对应马匹（新马首次入档也生效）
  useEffect(() => {
    if (!justSavedNo) return;
    const horse = archive.summaries.find((s) => s.horse.horseNo === justSavedNo);
    if (horse) setExpandedId(horse.horse.id);
  }, [justSavedNo, archive.summaries]);

  const handleSaved = (horseNo: string) => {
    setJustSavedNo(horseNo);
    setSavedFlash(`已保存 ${horseNo} 的修蹄记录，列表已更新。`);
    window.setTimeout(() => setSavedFlash(""), 2600);
  };

  const handleExport = () => {
    const csv = buildCSV({ horses: archive.summaries.map((s) => s.horse), version: 1 });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `蹄铁修整档案-${archive.nowISO}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="app">
      <header className="hero">
        <p>马术俱乐部 · 蹄铁师工作台</p>
        <h1>马术蹄铁修整档案</h1>
        <span>登记、复查、换铁历史全部保存在本机浏览器；同一匹马的每次修蹄按时间衔接，复查到期自动提醒。</span>
        <small className="hero-tip">数据日期基准：{archive.nowISO}（仅存本地，不上传）</small>
      </header>

      {archive.persistError && (
        <div className="banner-error">本地存储写入失败（可能是浏览器隐私模式或空间已满），本次修改刷新后会丢失。</div>
      )}
      {savedFlash && <div className="banner-ok">{savedFlash}</div>}

      <MetricsBar metrics={archive.metrics} />

      <ReminderPanel
        reminders={archive.reminders}
        nowISO={archive.nowISO}
        onHandle={(horseId, recordId) => archive.markReviewHandled(horseId, recordId, true)}
      />

      <section className="workspace">
        <RecordForm
          nowISO={archive.nowISO}
          horseNos={horseNos}
          findHorse={archive.findHorse}
          summaries={archive.summaries}
          onSubmit={archive.addRecord}
          onSaved={handleSaved}
        />
        <HorseList
          summaries={archive.visibleSummaries}
          total={archive.summaries.length}
          nowISO={archive.nowISO}
          filter={archive.filter}
          keyword={archive.keyword}
          expandedNo={expandedId}
          onFilterChange={archive.setFilter}
          onKeywordChange={archive.setKeyword}
          onToggleExpand={(id) => setExpandedId((cur) => (cur === id ? null : id))}
          onHandleReview={archive.markReviewHandled}
          onDelete={archive.deleteRecord}
          onExport={handleExport}
        />
      </section>

      <footer className="page-foot">
        记录（localStorage）、计算（lib/selectors）与展示（components）分层；清除浏览器站点数据会同时清空档案，可用导出 CSV 备份。
      </footer>
    </main>
  );
}

export default App;
