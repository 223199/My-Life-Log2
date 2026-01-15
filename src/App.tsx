import React from "react";
import { Routes, Route } from "react-router-dom";
import CalendarPage from "./pages/CalendarPage";
import DayMenuPage from "./pages/DayMenuPage";
import SectionPage from "./pages/SectionPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CalendarPage />} />
      <Route path="/day/:dateKey" element={<DayMenuPage />} />
      <Route path="/day/:dateKey/:section" element={<SectionPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="phoneFrame">
      <div className="phoneScreen">
        <div className="statusBar">
          <span>My Life Log</span>
          <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>

        {/* ここに今の page（あなたの既存UI）を入れる */}
        <div className="page">
          {/* ...既存の中身... */}
        </div>
      </div>
    </div>
  );
}

