// server/tournaments.js
const tournaments = {}; // { codice: { name, players: [], maxPlayers } }

function createTournament(code, name, maxPlayers) {
  if (!tournaments[code]) {
    tournaments[code] = { name, participants: [], maxPlayers };
  }
  return tournaments[code];
}

function addParticipant(code, participant) {
  if (!tournaments[code]) return false;
  if (tournaments[code].participants.length >= tournaments[code].maxPlayers) return false;

  tournaments[code].participants.push(participant);
  return true;
}

function removeParticipant(code, telegramId) {
  if (!tournaments[code]) return false;
  tournaments[code].participants = tournaments[code].participants.filter(p => p.telegramId !== telegramId);
  return true;
}

function getParticipants(code) {
  return tournaments[code]?.participants || [];
}

module.exports = { tournaments, createTournament, addParticipant, removeParticipant, getParticipants };
