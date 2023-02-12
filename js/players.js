import {
  getLastEvent,
  updatePlayerData,
  undoLastAction,
  fetchPlayers,
} from "./database.js";

const actionTypes = { wins: "Sieg", plus_fives: "+5" };

/**
 * Remove one or more elements from the DOM based on the selector string
 * @param {string} selector - The selector string to be used with document.querySelectorAll
 */
function removeElement(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(function (element) {
    element.remove();
  });
}

/**
 * createElement - Function to create an HTML element with specified attributes and properties
 *
 * @param  {string} elementType type of the element to be created (eg. 'div', 'span', 'button')
 * @param  {object} attributes object containing attributes and properties for the element
 * @return {HTMLElement}      newly created HTML element
 */
function createElement(elementType, attributes) {
  const element = document.createElement(elementType);
  for (let attr in attributes) {
    if (attributes.hasOwnProperty(attr)) {
      switch (attr) {
        case "class":
          element.classList.add(attributes[attr]);
          break;
        case "innerHTML":
          element.innerHTML = attributes[attr];
          break;
        case "onClick":
          element.addEventListener("click", attributes[attr]);
          break;
        default:
          element.setAttribute(attr, attributes[attr]);
      }
    }
  }
  return element;
}

/**

A function to add HTML players to the container element. This function fetches player data from the database,
updates the player data, removes any existing player rows, adds the last action with an undo button,
adds the player rows with their respective buttons, and finally adds the add player button.
*/
export async function addHtmlPlayers() {
  // Remove the last action container and add player button
  removeElement("div.last_action_container");
  removeElement("button.add_player_btn");
  removeElement("input");
  // Get the last action stats
  let lastActionStats = await getLastEvent();

  // Add the last action with undo button
  const lastActionContainer = createElement("div", {
    class: "last_action_container",
  });
  const lastActionSpan = createElement("span", {
    class: "last_action_span",
    innerHTML: lastActionStats
      ? `${lastActionStats[0]} mit ${actionTypes[lastActionStats[1]]}`
      : "No Database data",
  });
  const undoButton = createElement("button", {
    class: "undo_btn",
    innerHTML: "Undo",
    onClick: undoLastAction,
  });
  lastActionContainer.appendChild(lastActionSpan);
  lastActionContainer.appendChild(undoButton);
  container.appendChild(lastActionContainer);

  // Add the add player button
  const addPlayerBtn = createElement("button", {
    class: "add_player_btn",
    innerHTML: "Spieler hinzufügen",
    id: "add_player_btn",
    // onClick: convertButtonToInput,
  });
  addPlayerBtn.addEventListener("click", function () {
    convertButtonToInput(this);
  });
  container.appendChild(addPlayerBtn);

  // Remove all player rows
  removeElement("div.player_row");

  // Fetch players and update player data
  const { players, wins, plusFives } = await fetchPlayers();
  updatePlayerData(players, wins, plusFives);
  players.sort((a, b) => b.wins - a.wins);

  // Add player rows with buttons
  players.forEach((player) => {
    const playerDiv = createElement("div", { class: "player_row" });
    playerDiv.innerHTML = `<span class="player_name">${player.player_name}</span> <span class="stat_span">Siege: ${player.wins}</span> <span class="stat_span">+5: ${player.plusFives}</span> <span></span> <button class="player_btn" id="${player.player_name}" onclick="addWin('${player.player_name}')">Sieg</button> <button class="player_btn" id="${player.player_name}" onclick="addFive('${player.player_name}')">5+</button>`;
    container.insertBefore(playerDiv, lastActionContainer);
  });
}

/**
 * convertButtonToInput - Function that replaces a button with an input field and "Add" button
 *
 * @param  {HTMLElement} button the button to be converted
 */
function convertButtonToInput(button) {
  const originalText = button.innerHTML;
  const input = createElement("input", {
    type: "text",
    placeholder: "Spielername...",
    style: "transition: all 0.5s ease-in-out; opacity: 0;",
  });
  const addButton = createElement("button", {
    innerHTML: "Hinzufügen",
    class: "add_player_btn",
    style: "transition: all 0.5s ease-in-out; opacity: 0;",
    onClick: function () {
      if (input.value) {
        addPlayer(input.value);
      }
      input.value = "";
      input.style.opacity = 0;
      addButton.style.opacity = 0;
      setTimeout(() => {
        removeElement("input");
        // removeElement(addButton);
        button.innerHTML = originalText;
      }, 500);
    },
  });
  button.parentNode.replaceChild(input, button);
  input.parentNode.insertBefore(addButton, input.nextSibling);
  setTimeout(() => {
    input.style.opacity = 1;
    addButton.style.opacity = 1;
  }, 50);
}
