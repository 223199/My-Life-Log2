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
