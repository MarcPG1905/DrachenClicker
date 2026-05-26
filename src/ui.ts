import * as Buildings from "./data/buildings"
import * as Upgrades from "./data/upgrades"
import { calculateCost } from "./data/object"
import { element } from "./util/dom_helper"
import { game } from "./main"
import { formatNumber } from "./util/number_converter"
import { unit, unitPerSecond } from "./data/constants"

type NotificationItem = {
    element: HTMLDivElement,
    count: number,
    timeoutId: number,
}

export class UIMessenger {
    notificationTimeout: number | undefined

    private notifications = new Map<string, NotificationItem>()
    
    constructor(
        private shine: HTMLDivElement,
        private fxLayer: HTMLDivElement,
        private notificationBox: HTMLDivElement,
        private counter: HTMLElement,
        private wps: HTMLElement,
    ) {}

    spawnFloatingText(x: number, y: number, text: string) {
        const floatingText = element("div", {
            classes: [ "float-text" ],
            text: text,
            style: {
                left: x + "px",
                top: y + "px",
            },
        })

        this.fxLayer.appendChild(floatingText);

        // Remove after animation ends (looks despawned, but actually isn't without this)
        floatingText.addEventListener("animationend", () => floatingText.remove());
    }

    displayMessage(message: string, duration: number = 3000) {
        let item = this.notifications.get(message)

        if (item) {
            item.count++

            const label = item.element.querySelector<HTMLSpanElement>(".text")!
            label.innerHTML = `${message} (x${item.count})`

            clearTimeout(item.timeoutId)
            item.timeoutId = window.setTimeout(() => {
                this.removeMessage(message)
            }, duration)

            return
        }

        const div = element("div", {
            classes: [ "notificationItem" ],
            // +++ ChatGPT +++
            style: {
                opacity: "0",
                transform: "translateY(10px)"
            },
            // --- Ende ChatGPT ---
            children: [
                element("span", {
                    classes: [ "text" ],
                    html: message,
                })
            ],
        })
        this.notificationBox.appendChild(div)

        // +++ ChatGPT +++
        div.getBoundingClientRect()

        requestAnimationFrame(() => {
            div.classList.add("show")

            // cleanup inline styles so CSS owns it again
            div.style.opacity = ""
            div.style.transform = ""
        })
        // --- Ende ChatGPT ---

        const timeoutId = window.setTimeout(() => {
            this.removeMessage(message)
        }, duration)


        this.notifications.set(message, {
            element: div,
            count: 1,
            timeoutId: timeoutId,
        })
    }

    private removeMessage(message: string) {
        const item = this.notifications.get(message)
        if (!item) return

        const el = item.element

        el.classList.remove("show")
        el.classList.add("hide")

        el.addEventListener("transitionend", () => {
            el.remove()
        }, { once: true })

        clearTimeout(item.timeoutId)
        this.notifications.delete(message)
    }

    displayError(message: string, err: unknown, duration: number = 1000) {
        console.error(`${message}:`, err)
        this.displayMessage(`${message}: ${err}`, duration)
    }

    constructShop() {
        const upgradesParent = document.querySelector<HTMLElement>(`#upgrades`)!
        upgradesParent.innerHTML = ""

        for (const [id, bought] of Object.entries(game.upgradeState)) {
            if (bought) continue
            const upgrade = Upgrades.get(id)!
            upgradesParent.appendChild(this.createUpgrade(upgrade))
        }

        const buildingsParent = document.querySelector<HTMLElement>(`#buildings`)!
        buildingsParent.innerHTML = ""

        for (const [id] of Object.entries(game.buildingState)) {
            const building = Buildings.get(id)!
            buildingsParent.appendChild(this.createBuilding(building))
        }
    }

    private createUpgrade(upgrade: Upgrades.Upgrade): HTMLDivElement {
        return element("div", {
            classes: [ "upgradeProduct" ],
            onclick: () => { game.purchaseUpgrade(upgrade.id) },

            children: [
                element("div", {
                    classes: [ "icon" ],
                    style: {
                        backgroundPositionX: `${upgrade.icon * -48}px`
                    },
                }),
            ],
        })
    }

    private createBuilding(building: Buildings.Building): HTMLDivElement {
        return element("div", {
            classes: [ "buildingProduct" ],
            onclick: () => { game.purchaseBuilding(building.id) },

            children: [
                element("div", {
                    classes: [ "icon" ],
                    style: {
                        backgroundPositionX: `${building.uiId * -48}px`
                    },
                }),

                element("div", {
                    classes: [ "content" ],

                    children: [
                        element("div", {
                            classes: [ "productName" ],
                            text: building.name,
                        }),

                        element("span", {
                            id: `productPrice${building.uiId}`,
                            classes: [ "productPrice" ],
                            text: building.name,
                        }),

                        element("div", {
                            id: `productsOwned${building.uiId}`,
                            classes: [ "productsOwned" ],
                            text: building.name,
                        }),
                    ],
                })
            ],
        })
    }

    updateAll() {
        this.updateWealth()
        this.updateWps()

        this.updateShopUpgrades()
        for (const building of Buildings.dataset) {
            this.updateShopBuilding(building.id)
        }
    }

    updateWealth() {
        this.counter.innerHTML = `${unit}: ${formatNumber(game.wealth, true)}`
    }

    updateWps() {
        this.wps.innerHTML = `${formatNumber(game.wps)} ${unitPerSecond}`
    }

    updateShopUpgrades() {
        const upgradesParent = document.querySelector<HTMLElement>(`#upgrades`)!
        upgradesParent.innerHTML = ""

        for (const [id, bought] of Object.entries(game.upgradeState)) {
            if (bought) continue
            const upgrade = Upgrades.get(id)!
            upgradesParent.appendChild(this.createUpgrade(upgrade))
        }
    }

    updateShopBuilding(id: string) {
        const building = Buildings.get(id)!
        const amount = game.buildingState[id]
        const cost = calculateCost(building, amount)

        document.querySelector<HTMLElement>(`#productPrice${building.uiId}`)!.innerHTML = `${formatNumber(cost, true)} ${unit}`
        document.querySelector<HTMLElement>(`#productsOwned${building.uiId}`)!.innerHTML = `${amount}`
    }

    enableShine() {
        this.shine.style.opacity = "0.15"
    }

    disableShine() {
        this.shine.style.opacity = "0.0"
    }
}
