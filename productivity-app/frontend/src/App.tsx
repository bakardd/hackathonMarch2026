import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Setup } from "./pages/Setup";
import { Session } from "./pages/Session";
import { Summary } from "./pages/Summary";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Setup />} />
        <Route path="/session" element={<Session />} />
        <Route path="/summary/:sessionId" element={<Summary />} />
      </Routes>
    </BrowserRouter>
  );
}
