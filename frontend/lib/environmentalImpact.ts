import { Order } from './api'

// Cylinder weight mappings (in kg)
const CYLINDER_WEIGHTS: Record<string, number> = {
    '3KG': 3,
    '5KG': 5,
    '6KG': 6,
    '9KG': 9,
    '12KG': 12,
    '13KG': 13,
    '19KG': 19,
    '48KG': 48,
}

/**
 * Environmental Impact Constants
 * Based on research comparing LPG to traditional cooking fuels
 */
const IMPACT_CONSTANTS = {
    // CO2 savings per kg of LPG (vs charcoal)
    CO2_SAVED_PER_KG: 2.5 / 13, // 2.5kg CO₂ saved per 13kg cylinder

    // One tree absorbs approximately 20kg CO₂ per year
    CO2_PER_TREE_YEAR: 20,

    // LPG is 3x faster than charcoal cooking
    // Average family cooks ~2 hours/day, saves ~40 min/day with LPG
    TIME_SAVED_PER_ORDER_HOURS: 20, // ~20 hours saved per cylinder month

    // LPG is 30% more cost-effective over time (fuel + time value)
    COST_EFFICIENCY_PERCENT: 30,
}

/**
 * Get cylinder weight from type string
 */
export function getCylinderWeight(cylinderType: string): number {
    return CYLINDER_WEIGHTS[cylinderType] || 13 // Default to 13kg
}

/**
 * Calculate total CO2 savings from orders
 * Returns CO2 saved in kilograms
 */
export function calculateCO2Savings(orders: Order[]): number {
    const totalWeight = orders.reduce((sum, order) => {
        const weight = getCylinderWeight(order.cylinder_type)
        return sum + (weight * order.quantity)
    }, 0)

    return totalWeight * IMPACT_CONSTANTS.CO2_SAVED_PER_KG
}

/**
 * Calculate trees equivalent based on CO2 saved
 * Returns number of trees (partial values for accuracy)
 */
export function calculateTreesEquivalent(co2SavedKg: number): number {
    return co2SavedKg / IMPACT_CONSTANTS.CO2_PER_TREE_YEAR
}

/**
 * Calculate total time saved (in hours)
 * Returns hours saved from using LPG vs traditional cooking
 */
export function calculateTimeSaved(orders: Order[]): number {
    return orders.length * IMPACT_CONSTANTS.TIME_SAVED_PER_ORDER_HOURS
}

/**
 * Calculate cost savings percentage
 * Returns estimated cost savings amount based on total spent
 */
export function calculateCostSavings(orders: Order[]): number {
    const totalSpent = orders.reduce((sum, order) => sum + order.grand_total, 0)
    return totalSpent * (IMPACT_CONSTANTS.COST_EFFICIENCY_PERCENT / 100)
}

/**
 * Get educational tips about LPG benefits
 * Returns a random tip from the collection
 */
const EDUCATIONAL_TIPS = [
    {
        title: "Cleaner Indoor Air",
        message: "LPG produces 95% less indoor air pollution than charcoal, protecting your family's health.",
        icon: "wind"
    },
    {
        title: "Faster Cooking Time",
        message: "LPG cooks 3x faster than charcoal, saving you 40+ minutes every day for what matters most.",
        icon: "zap"
    },
    {
        title: "Cost Effective",
        message: "While upfront costs are higher, LPG saves 30% on total cooking expenses over time.",
        icon: "coins"
    },
    {
        title: "Protect Our Forests",
        message: "Every LPG order prevents 80% deforestation compared to charcoal, preserving Zambia's trees.",
        icon: "tree"
    },
    {
        title: "Climate Action",
        message: "LPG emits 50% less CO₂ than charcoal. Your choice fights climate change with every meal.",
        icon: "leaf"
    },
    {
        title: "Convenience & Control",
        message: "Instant heat control and no ash cleanup. LPG makes cooking easier and more efficient.",
        icon: "flame"
    },
    {
        title: "Safer for Kids",
        message: "No open flames or hot coals. LPG reduces burn risks and keeps your family safer.",
        icon: "shield"
    },
    {
        title: "Sustainable Energy",
        message: "LPG is a clean transition fuel, certified by environmental standards worldwide.",
        icon: "check-circle"
    }
]

export function getEducationalTip(): typeof EDUCATIONAL_TIPS[0] {
    const randomIndex = Math.floor(Math.random() * EDUCATIONAL_TIPS.length)
    return EDUCATIONAL_TIPS[randomIndex]
}

/**
 * Get all educational tips (for rotation)
 */
export function getAllEducationalTips(): typeof EDUCATIONAL_TIPS {
    return EDUCATIONAL_TIPS
}

/**
 * Format impact statistics for display
 */
export interface ImpactStats {
    co2Saved: string
    treesEquivalent: string
    timeSaved: string
    costSavings: string
    totalOrders: number
}

export function formatImpactStats(orders: Order[]): ImpactStats {
    const co2Saved = calculateCO2Savings(orders)
    const treesEquivalent = calculateTreesEquivalent(co2Saved)
    const timeSaved = calculateTimeSaved(orders)
    const costSavings = calculateCostSavings(orders)

    return {
        co2Saved: co2Saved.toFixed(1),
        treesEquivalent: treesEquivalent.toFixed(2),
        timeSaved: timeSaved.toFixed(0),
        costSavings: `K ${costSavings.toFixed(2)}`,
        totalOrders: orders.length
    }
}
