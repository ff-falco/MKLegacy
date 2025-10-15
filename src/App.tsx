import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import TierListPage from "./TierListPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tierlist" element={<TierListPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;