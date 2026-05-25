import { decode, encode } from "cbor-x"
import * as Buildings from "./data/buildings"
import { autosaveInterval, baseClickFactor, gameName, wealthUpdateInterval, unit, baseOfflineFactor, baseOfflineLimit } from "./data/constants"
import { calculateCost } from "./data/object"
import * as Upgrades from "./data/upgrades"
import { ui } from "./main"
import { formatDuration, formatNumber } from "./util/number_converter"

export class Game {
    wealth: number = 0

    clickFactor: number = baseClickFactor
    offlineFactor: number = baseOfflineFactor
    offlineLimit: number = baseOfflineLimit
    
    buildingState: Buildings.State = {}
    upgradeState: Upgrades.State = {}

    activeUpgrades: Upgrades.Upgrade[] = []

    wps: number = 0.0

    constructor() {
        this.initStates()
        this.loadGame()

        setInterval(() => {
            this.addWealth(this.wps * wealthUpdateInterval)
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

    resetData() {
        this.buildingState = {}
        this.upgradeState = {}
        this.activeUpgrades.length = 0
        this.initStates()

        this.wps = 0.0

        this.wealth = 0
        this.clickFactor = baseClickFactor
        this.offlineFactor = baseOfflineFactor
        this.offlineLimit = baseOfflineLimit

        ui.updateAll()
    }

    private serializeData() {
        const data = {
            time: Date.now(),
            wealth: this.wealth,
            buildingState: this.buildingState,
            upgradeState: this.upgradeState,
            clickFactor: this.clickFactor,
            offlineFactor: this.offlineFactor,
            offlineLimit: this.offlineLimit,
        }
        ui.displayMessage("Spiel gespeichert!")
        console.log("Game saved!")
        return data
    }

    private loadData(data: any) {
        try {
            this.wealth = data.wealth ?? 0
            this.clickFactor = data.clickFactor ?? this.clickFactor
            this.offlineFactor = data.offlineFactor ?? this.offlineFactor
            this.offlineLimit = data.offlineLimit ?? this.offlineLimit

            for (const [id, state] of Object.entries(data.buildingState)) {
                if (id in this.buildingState)
                    this.buildingState[id] = state as number
            }
            for (const [id, state] of Object.entries(data.upgradeState)) {
                if (id in this.upgradeState && state as boolean) {
                    this.upgradeState[id] = true
                    this.activeUpgrades.push(Upgrades.get(id)!)
                }
            }

            this.recalcWps(false)

            const deltaTimeSeconds = Math.floor((Date.now() - (data.time ?? Date.now())) / 1000)
            if (deltaTimeSeconds >= 10 && this.offlineFactor > 0 && this.offlineLimit > 0) {
                const addedWealth = this.wps * this.offlineFactor * Math.min(deltaTimeSeconds, this.offlineLimit)

                // Don't need to use the addWealth method, because updateAll is called anyways (end of the method)
                this.wealth += addedWealth
                ui.displayMessage(`In <b>${formatDuration(deltaTimeSeconds)}</b> wurden offline <b>${formatNumber(addedWealth)} ${unit}</b> generiert.`)
            }
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

    recalcWps(updateUi: boolean = true) {
        let wps = 0.0

        for (const [id, amount] of Object.entries(this.buildingState)) {
            const building = Buildings.get(id)!
            wps += building.baseWps * amount
        }

        for (const upgrade of this.activeUpgrades) {
            if (upgrade.wpsEffect)
                wps = upgrade.wpsEffect(wps)
        }

        this.wps = wps
        if (updateUi)
            ui.updateWps()
    }

    setWealth(amount: number) {
        this.wealth = amount
        ui.updateWealth()
    }

    removeWealth(amount: number) {
        this.wealth -= amount
        ui.updateWealth()
    }

    addWealth(amount: number) {
        this.wealth += amount
        ui.updateWealth()
    }

    click(event: MouseEvent) {
        const wpc = this.wps * this.clickFactor
        const added = Math.max(1, 0.9 + wpc/2, wpc)

        this.addWealth(added)
        ui.spawnFloatingText(event.clientX, event.clientY, "+" + formatNumber(added))
    }

    purchaseUpgrade(id: string): boolean {
        const upgrade = Upgrades.get(id)!
        const cost = calculateCost(upgrade, 0)

        if (this.wealth >= cost) {
            this.removeWealth(cost)
            this.upgradeState[id] = true
            this.activeUpgrades.push(upgrade)
            
            this.recalcWps()
            if (upgrade.clickFactorEffect)
                this.clickFactor = upgrade.clickFactorEffect(this.clickFactor)

            ui.updateShopUpgrades()
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

            this.recalcWps()

            ui.updateShopBuilding(id)
            return true
        } else {
            ui.displayMessage(`Nicht genug ${unit} um das Building zu kaufen!`)
            return false
        }
    }
}