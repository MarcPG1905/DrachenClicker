import { decode, encode } from "cbor-x"
import * as Buildings from "./data/buildings"
import { autosaveInterval, baseClickFactor, gameName, wealthUpdateInterval, unit } from "./data/constants"
import { calculateCost } from "./data/object"
import * as Upgrades from "./data/upgrades"
import { ui } from "./main"
import { formatNumber } from "./util/number_converter"

export class Game {
    paused: boolean = false

    wealth: number = 0
    
    buildingState: Buildings.State = {}
    upgradeState: Upgrades.State = {}

    clickFactor: number = baseClickFactor

    constructor() {
        this.initStates()
        this.loadGame()

        setInterval(() => {
            if (!this.paused)
                this.addWealth(this.getCurrentWps() * wealthUpdateInterval)
        }, wealthUpdateInterval * 1000)

        setInterval(() => { this.saveGame() }, autosaveInterval * 1000)
    }

    initStates() {
        for (const building of Buildings.dataset) {
            this.buildingState[building.id] = 0
        }

        for (const upgrade of Upgrades.dataset) {
            this.upgradeState[upgrade.id] = false
        }
    }

    private serializeData() {
        const data = {
            wealth: this.wealth,
            buildingState: this.buildingState,
            upgradeState: this.upgradeState,
            clickFactor: this.clickFactor,
        }
        ui.displayMessage("Spiel gespeichert!")
        console.log("Game saved!")
        return data
    }

    private loadData(data: any) {
        try {
            this.wealth = data.wealth ?? 0
            this.buildingState = data.buildingState ?? this.buildingState
            this.upgradeState = data.upgradeState ?? this.upgradeState
            this.clickFactor = data.clickFactor ?? this.clickFactor
        } catch (err) {
            ui.displayError("Spiel konnte nicht geladen werden", err)
        }

        ui.displayMessage("Spiel geladen!")
        console.log("Game loaded!")

        setTimeout(() => { ui.updateAll() })
    }

    saveGame() {
        localStorage.setItem("gameSave", JSON.stringify(this.serializeData()))
    }

    loadGame() {
        const saved = localStorage.getItem("gameSave")
        if (saved)
            this.loadData(JSON.parse(saved))
    }

    // +++ Start ChatGPT +++
    saveGameToFile() {
        const bytes = new Uint8Array(encode(this.serializeData()))
        const blob = new Blob([bytes], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${gameName}-Save.cbor`;
        a.click();

        URL.revokeObjectURL(url);
    }

    loadGameFromFile() {
        return new Promise<void>((resolve, reject) => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".cbor";

            input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return reject("No file selected");

                const buffer = await file.arrayBuffer();
                const data = decode(new Uint8Array(buffer));

                this.loadData(data);
                resolve();
            };

            input.click();
        });
    }
    // --- Ende ChatGPT ---

    resetData() {
        this.buildingState = {}
        this.upgradeState = {}
        this.initStates()

        this.wealth = 0
        ui.updateAll()
    }

    getCurrentWps(): number {
        let wps = 0.0

        for (const [id, amount] of Object.entries(this.buildingState)) {
            const building = Buildings.get(id)!
            wps += building.baseWps * amount
        }

        // TODO: Go through upgrades asswell.

        return wps
    }

    setWealth(amount: number) {
        this.wealth = amount
        ui.updateCounter()
    }

    removeWealth(amount: number) {
        this.wealth -= amount
        ui.updateCounter()
    }

    addWealth(amount: number) {
        this.wealth += amount
        ui.updateCounter()
    }

    click(event: MouseEvent) {
        const okpc = this.getCurrentWps() * this.clickFactor
        const added = Math.max(1, 0.9 + okpc/2, okpc)

        this.addWealth(added)
        ui.spawnFloatingText(event.clientX, event.clientY, "+" + formatNumber(added))
    }

    purchaseUpgrade(id: string): boolean {
        const upgrade = Upgrades.get(id)!
        const cost = calculateCost(upgrade, this.buildingState[id])

        if (this.wealth >= cost) {
            this.removeWealth(cost)
            this.upgradeState[id] = true
            ui.updateShop()
            return true
        } else {
            ui.displayMessage(`Nicht genug ${unit} um das Upgrade zu kaufen!`)
            return false
        }
    }

    purchaseBuilding(id: string): boolean {
        const building = Buildings.get(id)!
        const cost = calculateCost(building, this.buildingState[id])

        if (this.wealth >= cost) {
            this.removeWealth(cost)
            this.buildingState[id] += 1
            ui.updateShop()
            return true
        } else {
            ui.displayMessage(`Nicht genug ${unit} um das Building zu kaufen!`)
            return false
        }
    }
}