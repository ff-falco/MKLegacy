import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CreateTournamentPage() {
  const [formData, setFormData] = useState({
    name: "",
    players: "",
    stations: "",
    date: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Gestisci l'invio dei dati (ad esempio, invio a un server)
    alert(`Torneo "${formData.name}" creato con successo!`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white text-gray-800">
      <header className="w-full py-6 shadow-sm bg-white/70 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-center">Crea Torneo</h1>
      </header>

      <main className="flex flex-col items-center text-center px-6 mt-10 flex-grow w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-8 rounded-lg shadow-lg w-full"
        >
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nome del Torneo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
              placeholder="Inserisci il nome"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="players" className="block text-sm font-medium text-gray-700">
              Numero di Giocatori
            </label>
            <input
              id="players"
              name="players"
              type="number"
              value={formData.players}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Inserisci il numero"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="stations" className="block text-sm font-medium text-gray-700">
              Numero di Postazioni
            </label>
            <input
              id="stations"
              name="stations"
              type="number"
              value={formData.stations}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Inserisci il numero"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Data del Torneo
            </label>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <Button type="submit" variant="default" className="w-full" onClick={handleSubmit}>
            Crea Torneo
        </Button>
        </form>
      </main>

      <footer className="py-4 text-sm text-gray-500">
        © {new Date().getFullYear()} TorneoMaker — Tutti i diritti riservati
      </footer>
    </div>
  );
}
