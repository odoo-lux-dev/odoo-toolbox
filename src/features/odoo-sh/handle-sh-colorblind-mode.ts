const addColorBlindClass = (node: Node): void => {
    ;(node as Element).classList.add("x-odoo-options-colorblind-mode")
}

export { addColorBlindClass }
