import { game, ui } from "./main"
import { gameName } from "./data/constants"
import { decode, encode } from "cbor-x"

function serializeData() {
    const data = game.getData()
    ui.displayMessage("Spiel gespeichert!")
    console.log("Game saved!")
    return data
}

function loadData(data: any) {
    try {
        game.applyData(data)
    } catch (err) {
        ui.displayError("Spiel konnte nicht geladen werden", err)
    }

    ui.displayMessage("Spiel geladen!")
    console.log("Game loaded!")

    setTimeout(() => { ui.updateAll() })
}

export function saveGame() {
    if (!game.loaded)
        throw new Error("Cannot save game before loading.")
    
    localStorage.setItem("gameSave", JSON.stringify(serializeData()))
}

export function loadGame() {
    const saved = localStorage.getItem("gameSave")
    if (saved)
        loadData(JSON.parse(saved))
}

// +++ Start ChatGPT +++
export function saveGameToFile() {
    if (!game.loaded)
        throw new Error("Cannot save game before loading.")

    const bytes = new Uint8Array(encode(serializeData()))
    const blob = new Blob([bytes], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${gameName}-Save.cbor`;
    a.click();

    URL.revokeObjectURL(url);
}

export function loadGameFromFile() {
    return new Promise<void>((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".cbor";

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return reject("No file selected");

            const buffer = await file.arrayBuffer();
            const data = decode(new Uint8Array(buffer));

            loadData(data);
            resolve();
        };

        input.click();
    });
}
// --- Ende ChatGPT ---