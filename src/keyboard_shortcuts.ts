import { loadGameFromFile, saveGame, saveGameToFile } from "./game_saver"

export function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey || e.metaKey) { // Linux, Windows, Mac, usw.
            switch (e.code) {
                case "KeyS":
                    e.preventDefault()
                    if (e.shiftKey) {
                        saveGameToFile()
                    } else {
                        saveGame()
                    }
                    break;
                case "KeyL":
                    e.preventDefault()
                    loadGameFromFile()
                    break;
                default:
                    break;
            }
        }
    })
}
