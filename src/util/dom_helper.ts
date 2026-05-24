// ChatGPT Code

type ElementOptions = {
    id?: string
    classes?: string[]
    text?: string
    html?: string
    attributes?: Record<string, string>
    style?: Partial<CSSStyleDeclaration>
    children?: HTMLElement[]
    onclick?: (this: GlobalEventHandlers, ev: MouseEvent) => any
}

export function element<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options: ElementOptions = {},
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag)

    if (options.id) {
        el.id = options.id
    }

    if (options.classes) {
        el.classList.add(...options.classes)
    }

    if (options.text !== undefined) {
        el.textContent = options.text
    }

    if (options.html !== undefined) {
        el.innerHTML = options.html
    }

    if (options.attributes) {
        for (const [key, value] of Object.entries(options.attributes)) {
            el.setAttribute(key, value)
        }
    }

    if (options.style) {
        Object.assign(el.style, options.style)
    }

    if (options.children) {
        el.append(...options.children)
    }

    if (options.onclick) {
        el.onclick = options.onclick
    }

    return el
}
