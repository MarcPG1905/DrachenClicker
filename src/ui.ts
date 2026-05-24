import * as Buildings from "./data/buildings"
import { calculateCost } from "./data/object"
import { element } from "./util/dom_helper"
import { game } from "./main"
import { formatNumber } from "./util/number_converter"
import { unit, unitPerSecond } from "./data/constants"

export class UIMessenger {
    notificationTimeout: number | undefined
    
    constructor(
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

    displayMessage(message: string, duration: number = 1000) {
        this.notificationBox.textContent = message
        this.notificationBox.classList.add("show")
        
        clearTimeout(this.notificationTimeout)
        this.notificationTimeout = window.setTimeout(() => {
            this.notificationBox.classList.remove("show")
        }, duration)
    }

    displayError(message: string, err: unknown, duration: number = 1000) {
        console.error(`${message}:`, err)
        this.displayMessage(`${message}: ${err}`, duration)
    }

    constructShop() {
        const parent = document.querySelector<HTMLElement>(`#buildings`)!
        parent.innerHTML = ""

        for (const [id] of Object.entries(game.buildingState)) {
            const building = Buildings.get(id)!
            parent.appendChild(this.createBuilding(building))
        }
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
        this.updateCounter()
        this.updateShop()
    }

    updateCounter() {
        this.counter.innerHTML = `${unit}: ${formatNumber(game.wealth, true)}`
        this.wps.innerHTML = `${formatNumber(game.getCurrentWps())} ${unitPerSecond}`
    }

    updateShop() {
        for (const [id, amount] of Object.entries(game.buildingState)) {
            const building = Buildings.get(id)!
            const cost = calculateCost(building, amount)

            document.querySelector<HTMLElement>(`#productPrice${building.uiId}`)!.innerHTML = `${formatNumber(cost, true)} ${unit}`
            document.querySelector<HTMLElement>(`#productsOwned${building.uiId}`)!.innerHTML = `${amount}`
        }
    }
}
