import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { addHtmlPlayers } from "./players.js";

const supabase = createClient(
  "https://vqpcftnsmuirgoeiuehl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcGNmdG5zbXVpcmdvZWl1ZWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzMyODczNTgsImV4cCI6MTk4ODg2MzM1OH0.xYxrI6bXS1Y-1qMTYXldQP-tlUyEmVzcxK23NVJQ_f8"
);

const { data, error } = await supabase.auth.getSession();
const loginForm = document.getElementById("login-form");
const container = document.getElementById("container");

if (data.session && loginForm) {
  loginForm.style.display = "none";
  container.style.display = "flex";
  addHtmlPlayers();
}
console.log(data.session);

/**
 * Asynchronously fetches player data from the database.
 * @returns {Object} An object containing arrays of players, wins, and plusFives.
 */
export async function fetchPlayers() {
  // Get player data from the database.
  const { data: players, error: playerError } = await supabase
    .from("players")
    .select("player_name");

  // Get win data from the database.
  const { data: wins, error: winsError } = await supabase
    .from("wins")
    .select("player_name, created_at");

  // Get plusFives data from the database.
  const { data: plusFives, error: plusFivesError } = await supabase
    .from("plus_fives")
    .select("player_name, created_at");

  return { players, wins, plusFives };
}

/**
 * Updates player data with the number of wins and plusFives.
 * @param {Array} players - An array of player objects.
 * @param {Array} wins - An array of win objects.
 * @param {Array} plusFives - An array of plusFive objects.
 */
export function updatePlayerData(players, wins, plusFives) {
  // Reset the win and plusFives count for each player.
  players.forEach((player) => {
    player.wins = 0;
    player.plusFives = 0;
  });

  // Update the win count for each player.
  wins.forEach((win) => {
    const player = players.find((p) => p.player_name === win.player_name);
    if (player) {
      player.wins++;
    }
  });

  // Update the plusFives count for each player.
  plusFives.forEach((plusFive) => {
    const player = players.find((p) => p.player_name === plusFive.player_name);
    if (player) {
      player.plusFives++;
    }
  });
}

/**
 * Retrieve the player name and type of the last recorded win or plus five event
 * @returns {Array} [player_name: string, type: string] | null
 *   The player name and type of the last recorded event, or null if the database is empty or if there is a time error
 */
export async function getLastEvent() {
  var [{ data: lastWin }, { data: lastPlusFive }] = await Promise.all([
    supabase
      .from("wins")
      .select("player_name, created_at")
      .order("id", { ascending: false })
      .limit(1),
    supabase
      .from("plus_fives")
      .select("player_name, created_at")
      .order("id", { ascending: false })
      .limit(1),
  ]);

  // deconstruction of the array
  [lastPlusFive] = lastPlusFive;
  [lastWin] = lastWin;

  if (!lastWin && !lastPlusFive) {
    console.log("Error: The database is empty");
    return null;
  }

  if (!lastWin) {
    return [lastPlusFive.player_name, "plus_fives"];
  }

  if (!lastPlusFive) {
    return [lastWin.player_name, "wins"];
  }

  const timeWins = new Date(lastWin.created_at);
  const timePlusFive = new Date(lastPlusFive.created_at);

  if (timeWins > timePlusFive) {
    return [lastWin.player_name, "wins"];
  }

  if (timeWins < timePlusFive) {
    return [lastPlusFive.player_name, "plus_fives"];
  }

  console.log("Time Error:", lastWin, lastPlusFive);
  return null;
}

/**
Undoes the last recorded win or plus_five event.
*/
export async function undoLastAction() {
  const lastEvent = await getLastEvent();
  if (!lastEvent) {
    return;
  }

  const [playerName, action] = lastEvent;
  const { data: deletedAction, error } = await supabase
    .from(action)
    .delete()
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    console.error(`Error deleting last action: ${error}`);
    return;
  }

  addHtmlPlayers();
}

/**
 * Logs in the user with email and password.
 *
 * On success, hides the login form and displays the "Logged in" button.
 * On error, displays an error message.
 */
async function login() {
  // Get the email and password values from the input elements
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Call the signInWithPassword method of the Supabase auth API
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Check if there was an error with the login
  if (error) {
    console.error(error);
  } else {
    // The login was successful, hide the login form and show the "Logged in" button
    console.log("Logged in successfully");
    loginForm.style.display = "none";
    container.style.display = "flex";
    addHtmlPlayers();
  }
}

async function addWin(id) {
  const { error } = await supabase
    .from("wins")
    .insert({ player_name: String(id) });
  addHtmlPlayers();
}

async function addFive(id) {
  const { error } = await supabase
    .from("plus_fives")
    .insert({ player_name: String(id) });
  addHtmlPlayers();
}

async function addPlayer(name) {
  const { error } = await supabase
    .from("players")
    .insert({ player_name: String(name) });
  addHtmlPlayers();
}

// Add a submit event listener to the form
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent the form from being submitted
    login(); // Call the login function
  });
}

window.addWin = addWin;
window.addFive = addFive;
window.addPlayer = addPlayer;
window.addHtmlPlayers = addHtmlPlayers;
