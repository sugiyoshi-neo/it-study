import { Link, Route, Routes } from "react-router-dom";
import { PracticePage } from "./pages/PracticePage";
import { StartPage } from "./pages/StartPage";
import { TopicPage } from "./pages/TopicPage";

export function App() {
  return (
    <>
      <header className="app-header">
        <Link to="/" className="app-title">
          IT学習
        </Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/topic/:id" element={<TopicPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

function NotFound() {
  return (
    <div className="page">
      <p>ページが見つかりません。</p>
      <Link to="/">はじめに戻る</Link>
    </div>
  );
}
