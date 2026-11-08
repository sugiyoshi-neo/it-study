import { useEffect } from "react";
import { Link, NavLink, Route, Routes, useLocation, useNavigationType } from "react-router-dom";
import { BookmarksPage } from "./pages/BookmarksPage";
import { DrillPage } from "./pages/DrillPage";
import { HomePage } from "./pages/HomePage";
import { PracticePage } from "./pages/PracticePage";
import { SearchPage } from "./pages/SearchPage";
import { SessionPage, SessionsPage } from "./pages/SessionsPage";
import { TopicPage } from "./pages/TopicPage";

export function App() {
  return (
    <>
      <ScrollToTop />
      <header className="app-header">
        <Link to="/" className="app-title">
          IT学習ノート
        </Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/topic/:id" element={<TopicPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:key" element={<SessionPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/drill" element={<DrillPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <TabBar />
    </>
  );
}

/** 新しい画面に進んだときは先頭から表示する(「戻る」のときは動かさない) */
function ScrollToTop() {
  const { pathname } = useLocation();
  const type = useNavigationType();
  useEffect(() => {
    if (type !== "POP") window.scrollTo(0, 0);
  }, [pathname, type]);
  return null;
}

const ICONS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z",
  sessions: "M4 5h16v11H8l-4 4zM8 9h8M8 12h5",
  search: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.5 15.5 21 21",
  bookmarks: "M6 3h12v18l-6-4-6 4z",
  drill: "M4 4h16v16H4zM8 9l2 2 4-4M8 15h8",
};

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d={ICONS[name]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function TabBar() {
  const { pathname } = useLocation();
  // トピック画面はホーム(目次)の続きとして扱う
  const active = (prefixes: string[]) => prefixes.some((p) => (p === "/" ? pathname === "/" || pathname.startsWith("/topic") : pathname.startsWith(p)));
  const tabs = [
    { to: "/", label: "ホーム", icon: "home", match: ["/"] },
    { to: "/sessions", label: "セッション", icon: "sessions", match: ["/sessions"] },
    { to: "/search", label: "検索", icon: "search", match: ["/search"] },
    { to: "/bookmarks", label: "しおり", icon: "bookmarks", match: ["/bookmarks"] },
    { to: "/drill", label: "演習", icon: "drill", match: ["/drill", "/practice"] },
  ];
  return (
    <nav className="tab-bar" aria-label="メインメニュー">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} className={() => `tab ${active(t.match) ? "active" : ""}`} aria-current={active(t.match) ? "page" : undefined}>
          <Icon name={t.icon} />
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function NotFound() {
  return (
    <div className="page">
      <p>ページが見つかりません。</p>
      <Link to="/">目次に戻る</Link>
    </div>
  );
}
