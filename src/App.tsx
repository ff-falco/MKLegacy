import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import TierListPage from "./TierListPage";
import TournamentPage from "./TournamentPage";
import PreTournamentPage from "./PreTournamentPage";
import RaceManagerPage from "./RaceManagerPage";




function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tierlist" element={<TierListPage />} />
        <Route path="/tournament/:code" element={<TournamentPage />} />
        <Route path="/pretournament/:code" element={<PreTournamentPage/>} />
        <Route path="/racemanager/:code" element={<RaceManagerPage/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;