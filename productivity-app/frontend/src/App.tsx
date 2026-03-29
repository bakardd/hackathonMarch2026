import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Setup } from "./pages/Setup";
import { Session } from "./pages/Session";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Setup />} />
        <Route path="/session" element={<Session />} />
      </Routes>
    </BrowserRouter>
  );
}
