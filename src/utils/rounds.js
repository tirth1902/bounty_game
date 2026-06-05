import { formatRevealTime, isValidGameNumber } from "./game";
import { readStorage } from "./storage";

export function validateRoundTitle(roundTitle) {
  if (roundTitle.trim() === "") {
    return "Round title is required.";
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

export function validateWinningNumber(winningNumber) {
  if (winningNumber.trim() === "") {
    return "Winning number is required.";
  }

  if (!isValidGameNumber(winningNumber)) {
    return "Winning number must be from 1 to 99.";
  }

  return "";
}

export function validateRoundForm(values) {
  const errors = {};

  const roundTitleError = validateRoundTitle(values.roundTitle);
  const revealTimeError = validateRevealTime(values.revealTime);
  const winningNumberError = validateWinningNumber(values.winningNumber);

  if (roundTitleError) {
    errors.roundTitle = roundTitleError;
  }

  if (revealTimeError) {
    errors.revealTime = revealTimeError;
  }

  if (winningNumberError) {
    errors.winningNumber = winningNumberError;
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

export { formatRevealTime };
