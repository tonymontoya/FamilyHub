/**
 * List Templates
 * 
 * Pre-built templates for common list types.
 * Users can select a template when creating a new list
 * to quickly populate it with common items.
 */

export interface TemplateItem {
  name: string
  quantity?: number
  notes?: string
}

export interface ListTemplate {
  id: string
  title: string
  description: string
  type: "SHOPPING" | "PACKING" | "WISHLIST" | "CUSTOM"
  items: TemplateItem[]
}

export const listTemplates: ListTemplate[] = [
  {
    id: "grocery-basics",
    title: "Weekly Groceries",
    description: "Basic grocery shopping list",
    type: "SHOPPING",
    items: [
      { name: "Milk", quantity: 1 },
      { name: "Bread", quantity: 1 },
      { name: "Eggs", quantity: 12 },
      { name: "Butter", quantity: 1 },
      { name: "Chicken breast", quantity: 2, notes: "lbs" },
      { name: "Rice", quantity: 1, notes: "bag" },
      { name: "Pasta", quantity: 2, notes: "boxes" },
      { name: "Tomatoes", quantity: 4 },
      { name: "Onions", quantity: 3 },
      { name: "Garlic", quantity: 1, notes: "bulb" },
      { name: "Bananas", quantity: 6 },
      { name: "Apples", quantity: 4 },
    ],
  },
  {
    id: "weekend-trip",
    title: "Weekend Trip",
    description: "Essential items for a weekend getaway",
    type: "PACKING",
    items: [
      { name: "Toothbrush" },
      { name: "Toothpaste" },
      { name: "Deodorant" },
      { name: "Phone charger" },
      { name: "Underwear", quantity: 3 },
      { name: "Socks", quantity: 3 },
      { name: "T-shirts", quantity: 3 },
      { name: "Pajamas" },
      { name: "Medications" },
      { name: "Wallet / ID" },
      { name: "Sunglasses" },
      { name: "Snacks for travel" },
    ],
  },
  {
    id: "beach-day",
    title: "Beach Day",
    description: "Everything needed for a day at the beach",
    type: "PACKING",
    items: [
      { name: "Sunscreen", quantity: 1, notes: "SPF 30+" },
      { name: "Beach towels", quantity: 4 },
      { name: "Swimsuits", quantity: 4 },
      { name: "Beach umbrella" },
      { name: "Cooler with ice" },
      { name: "Water bottles", quantity: 6 },
      { name: "Beach toys / bucket" },
      { name: "Beach chairs", quantity: 2 },
      { name: "Change of clothes", quantity: 4 },
      { name: "Snacks" },
      { name: "Wet wipes" },
      { name: "First aid kit" },
    ],
  },
  {
    id: "birthday-wishlist",
    title: "Birthday Wishlist",
    description: "Gift ideas for birthday",
    type: "WISHLIST",
    items: [
      { name: "Books", notes: "Check Amazon wishlist" },
      { name: "Board games", notes: "Family games preferred" },
      { name: "Gift cards", notes: "Amazon, Target, or local shops" },
      { name: "Art supplies", notes: "Watercolors, sketchbook" },
      { name: "Sports equipment", notes: "Basketball or soccer ball" },
      { name: "Science kit" },
      { name: "Musical instrument", notes: "Keyboard or ukulele" },
    ],
  },
  {
    id: "holiday-gifts",
    title: "Holiday Shopping",
    description: "Gift shopping for the holidays",
    type: "SHOPPING",
    items: [
      { name: "Wrapping paper", quantity: 3, notes: "different designs" },
      { name: "Gift bags", quantity: 5 },
      { name: "Tape" },
      { name: "Gift tags" },
      { name: "Bows / ribbons" },
      { name: "Holiday cards" },
      { name: "Boxes for shipping" },
    ],
  },
  {
    id: "car-camping",
    title: "Car Camping",
    description: "Essentials for camping with the car nearby",
    type: "PACKING",
    items: [
      { name: "Tent" },
      { name: "Sleeping bags", quantity: 4 },
      { name: "Pillows", quantity: 4 },
      { name: "Flashlights", quantity: 2 },
      { name: "Lantern" },
      { name: "Camping chairs", quantity: 4 },
      { name: "Cooler" },
      { name: "Bug spray" },
      { name: "Firewood" },
      { name: "Matches / lighter" },
      { name: "Trash bags" },
      { name: "Paper towels" },
    ],
  },
]

export function getTemplatesByType(type: string): ListTemplate[] {
  if (type === "all") return listTemplates
  return listTemplates.filter((template) => template.type === type)
}

export function getTemplateById(id: string): ListTemplate | undefined {
  return listTemplates.find((template) => template.id === id)
}
