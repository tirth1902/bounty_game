import { formatRevealTime } from "./game";
import { readStorage } from "./storage";

export function sanitizeRoundTitle(roundTitle) {
  return roundTitle.replace(/^\s*\d+/, "");
}

export function validateRoundTitle(roundTitle) {
  const cleanedTitle = roundTitle.trim();

  if (cleanedTitle === "") {
    return "Round title is required.";
  }

  if (/^\d/.test(cleanedTitle)) {
    return "Round title cannot start with a number.";
  }

  return "";
}

export function validateRevealTime(revealTime) {
  if (!revealTime) {
    return "Reveal time is required.";
  }

  const selectedDate = new Date(revealTime);
  if (selectedDate < new Date()) {
    return "Past date and time not allowed.";
  }

  return "";
}



export function validateRoundForm(values) {
  const errors = {};

  const roundTitleError = validateRoundTitle(values.roundTitle);
  const revealTimeError = validateRevealTime(values.revealTime);

  if (roundTitleError) {
    errors.roundTitle = roundTitleError;
  }

  if (revealTimeError) {
    errors.revealTime = revealTimeError;
  }

  return errors;
}

export function getActiveRoundBets(roundId) {
  if (!roundId) return [];

  return Object.keys(localStorage)
    .filter((key) => key.startsWith("bountyEntry_"))
    .map((key) => readStorage(key, null))
    .filter((bet) => bet && String(bet.roundId) === String(roundId));
}

export function getAllRoundBets() {
  const rounds = readStorage("bountyRounds", []);
  const now = Date.now();

  const allBets = Object.keys(localStorage)
    .filter((key) => key.startsWith("bountyEntry_"))
    .map((key) => readStorage(key, null))
    .filter(Boolean);

  return allBets.map((bet) => {
    const round = rounds.find(
      (r) => String(r.id) === String(bet.roundId),
    );

    const revealTime = round ? new Date(round.revealTime).getTime() : 0;
    const isEnded =
      round && (round.resultRevealed || revealTime <= now);

    let outcome = "";
    if (isEnded && bet.username) {
      const resultKey = `bountyResult_${bet.username}_${bet.id}`;
      const result = readStorage(resultKey, null);
      if (result) {
        outcome = result.outcome;
      }
    }

    return {
      ...bet,
      isEnded,
      outcome,
    };
  });
}

export { formatRevealTime };
