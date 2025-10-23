import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import TierListPage from "./TierListPage";
import TournamentPage from "./TournamentPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tierlist" element={<TierListPage />} />
        <Route path="/tournament/:code" element={<TournamentPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;