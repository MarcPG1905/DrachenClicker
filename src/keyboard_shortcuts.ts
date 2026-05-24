import { game } from "./main"

export function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey) { // Linux, Windows, Mac, usw.
            switch (e.code) {
                case "KeyS":
                    e.preventDefault()
                    if (e.shiftKey) {
                        game.saveGameToFile()
                    } else {
                        game.saveGame()
                    }
                    break;
                case "KeyL":
                    e.preventDefault()
                    game.loadGameFromFile()
                    break;
                default:
                    break;
            }
        }
    })
}
