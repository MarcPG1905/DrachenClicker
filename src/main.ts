import './style.css'
import { Game } from './game'
import { UIMessenger as UI } from './ui'
import { setupKeyboardShortcuts } from './keyboard_shortcuts'
import { saveGame } from './game_saver'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/ `
<div id="notification"></div>
<div id="fx-layer"></div>
<div id="tooltip"></div>
<div id="bigButtonSection" class="mainSection">
    <div id="bigButtonParts">
        <h1 id="counter"></h1>
        <div id="wps" class="centerText"></div>
        <button id="bigButton" class="centerText"></button>
    </div>
</div>
<div id="shopSection" class="mainSection">
    <h1>Shop</h1>
    <div id="upgrades" class="shopPart"></div>
    <div id="buildings" class="shopPart"></div>
</div>
`

export const ui = new UI(
    document.querySelector<HTMLDivElement>('#fx-layer')!,
    document.querySelector<HTMLDivElement>('#notification')!,
    document.querySelector<HTMLElement>('#counter')!,
    document.querySelector<HTMLElement>('#wps')!,
)

export const game = new Game()

ui.constructShop()
ui.updateAll()

setupKeyboardShortcuts()

document.querySelector<HTMLButtonElement>('#bigButton')!
    .addEventListener('click', (e) => game.click(e))

// Allow cheating in F12 console (for testing).
Object.assign(globalThis, {
    "Game": game,
    "UI": ui,
})

// Auto-save when closing (or maybe some other events aswell, not sure)
window.addEventListener("beforeunload", () => { saveGame() })
