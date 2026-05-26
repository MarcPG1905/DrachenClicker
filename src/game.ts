import * as Buildings from "./data/buildings"
import { autosaveInterval, baseClickFactor, unit, baseOfflineFactor, baseOfflineLimit, baseOccurrenceTimer as baseOccurrenceTimeMax, tickInterval, tps, baseMeddlModeTime, occurrenceSize, unitPerSecond } from "./data/constants"
import { calculateCost } from "./data/object"
import * as Upgrades from "./data/upgrades"
import { loadGame, saveGame } from "./game_saver"
import { game, ui } from "./main"
import { boolByChance, spawnChance } from "./util/calc"
import { element } from "./util/dom_helper"
import { formatDuration, formatNumber } from "./util/number_converter"

class Occurrence {
    private div: HTMLDivElement

    private life: number = 0
    private clicked: boolean = false

    constructor(
        public duration: number,

        private x = Math.floor(Math.random() * (window.innerWidth - occurrenceSize)),
        private y = Math.floor(Math.random() * (window.innerHeight - occurrenceSize)),
    ) {
        this.div = element("div", {
            classes: [ "occurrence" ],
            style: {
                left: `${this.x}px`,
                top: `${this.y}px`,
            },
            onclick: () => this.click(),
        })
        ui.addFxElement(this.div)
        
        game.currentOccurrence = this
    }

    tick() {
        this.life++

        const curve = 1 - ((this.life / this.duration) * 2 - 1) ** 4

        const hash = this.x * this.y

        const rotation = Math.sin(hash * 0.69) * 24 + Math.sin(game.currentTick * (0.35 + Math.sin(hash * 0.97) * 0.15) + hash) * (3 + Math.sin(hash * 0.36) * 2) // ChatGPT
        const scale = 3 * (1 + Math.sin(hash * 0.53) * 0.2) * curve * (1 + (0.06 + Math.sin(hash * 0.41) * 0.05) * (Math.sin(game.currentTick * (0.25 + Math.sin(hash * 0.73) * 0.15) + hash)))

        this.div.style.transform = `rotate(${rotation}deg) scale(${scale})`

        if (this.life >= this.duration) this.despawn()
    }

    click() {
        if (this.clicked) return
        this.clicked = true
    
        game.enableMeddlMode()
        this.despawn()
    }

    despawn() {
        ui.removeFxElement(this.div)
        this.div.remove()
        game.currentOccurrence = undefined
    }
}

export class Game {
    loaded: boolean = false

    // Modifiable "Constants"
    clickFactor: number = baseClickFactor
    offlineFactor: number = baseOfflineFactor
    offlineLimit: number = baseOfflineLimit
    occurrenceTimeMax: number = baseOccurrenceTimeMax
    meddlModeTime: number = baseMeddlModeTime
    
    // Shop State
    buildingState: Buildings.State = {}
    upgradeState: Upgrades.State = {}

    activeUpgrades: Upgrades.Upgrade[] = []

    // Cached Values
    wps: number = 0.0

    meddlModeWealth = 0

    // Game State
    wealth: number = 0
    occurrenceTimer: number = 0
    meddlModeLeft: number = 0
    currentTick: number = 0

    currentOccurrence?: Occurrence

    constructor() {
        this.initStates()
        
        // Timeout so this instance is fully constructed before accessing externally.
        setTimeout(() => {
            loadGame()
            this.loaded = true
        })

        setInterval(() => {
            if (this.loaded) // Never save before loading, cause that would just reset game state.
                saveGame()
        }, autosaveInterval * 1000)

        // Run UPS ticking logic.
        let lastTick = Date.now()
        setInterval(() => {
            this.currentTick++

            const currentTime = Date.now()
            this.tick(currentTime - lastTick, this.currentTick)

            lastTick = currentTime
        }, tickInterval * 1000)
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

    getData() {
        return {
            time: Date.now(),
            wealth: this.wealth,
            buildingState: this.buildingState,
            upgradeState: this.upgradeState,
            clickFactor: this.clickFactor,
            offlineFactor: this.offlineFactor,
            offlineLimit: this.offlineLimit,
        }
    }

    applyData(data: any) {
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
    }

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

        if (this.meddlModeLeft > 0)
            wps *= 8

        this.wps = wps
        if (updateUi)
            ui.updateWps()
    }

    setWealth(amount: number) {
        this.wealth = amount
        ui.updateWealth()
    }

    modWealth(amount: number) {
        this.wealth += amount
        ui.updateWealth()

        if (amount > 0 && this.meddlModeLeft > 0)
            this.meddlModeWealth += amount
    }

    enableMeddlMode() {
        ui.enableShine()
        this.meddlModeLeft = this.meddlModeTime
        this.recalcWps()

        ui.displayMessage(`Für die nächsten <b>${formatDuration(this.meddlModeTime)}</b> gibt dir der Meddl-Mode <b>8x</b> mehr ${unitPerSecond}.`, 5000)
    }

    disableMeddlMode() {
        ui.disableShine()
        this.meddlModeLeft = 0
        this.recalcWps()

        ui.displayMessage(`Du hast während diesem Meddl-Mode <b>${formatNumber(this.meddlModeWealth)} ${unit}</b> gemacht.`, 3000)
        this.meddlModeWealth = 0
    }

    // ================= //
    // Actual Game Logic //
    // ================= //

    tick(deltaMs: number, tick: number) {
        this.modWealth(this.wps * (deltaMs / 1000))

        this.currentOccurrence?.tick()

        if (Math.floor(tick) % tps == 0) { // Every second
            if (this.meddlModeLeft > 0 && --this.meddlModeLeft <= 0)
                this.disableMeddlMode()

            if (!this.currentOccurrence) {
                this.occurrenceTimer++

                const chance = spawnChance(
                    this.occurrenceTimer,
                    this.occurrenceTimeMax / 3,
                    this.occurrenceTimeMax
                )

                if (boolByChance(chance)) {
                    this.occurrenceTimer = 0
                    this.spawnOccurrence()
                }
            }
        }
    }

    click(event: MouseEvent) {
        const wpc = this.wps * this.clickFactor
        const added = Math.max(1, 0.9 + wpc/2, wpc)

        this.modWealth(added)
        ui.spawnFloatingText(event.clientX, event.clientY, "+" + formatNumber(added))
    }

    spawnOccurrence() {
        new Occurrence(15 * tps)
    }

    purchaseUpgrade(id: string): boolean {
        const upgrade = Upgrades.get(id)!
        const cost = calculateCost(upgrade, 0)

        if (this.wealth >= cost) {
            this.modWealth(-cost)
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
            this.modWealth(-cost)
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
