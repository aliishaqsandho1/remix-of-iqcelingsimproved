
// Coastal Blues color palette for dashboard charts
// #012A4A, #013A63, #01497C, #014F86, #2A6F97, #2C7DA0, #468FAF, #61A5C2, #89C2D9, #A9D6E5

export const cashFlowChartConfig = {
  inflow: {
    label: "Cash Inflow",
    color: "#2A6F97",
  },
  outflow: {
    label: "Cash Outflow",
    color: "#012A4A",
  },
  net: {
    label: "Net Cash Flow",
    color: "#468FAF",
  },
}

// Coastal Blues color palette
export const defaultColors = [
  "#012A4A",
  "#013A63",
  "#01497C",
  "#014F86",
  "#2A6F97",
  "#2C7DA0",
  "#468FAF",
  "#61A5C2",
  "#89C2D9",
  "#A9D6E5",
];

// Category config with Coastal Blues
export const categoryChartConfig = {
  "UV Sheets": { label: "UV Sheets", color: "#012A4A" },
  "Taj Sheets": { label: "Taj Sheets", color: "#013A63" },
  "ZRK": { label: "ZRK", color: "#01497C" },
  "Lamination": { label: "Lamination", color: "#014F86" },
  "Test Category": { label: "Test Category", color: "#2A6F97" },
  "PATEX": { label: "PATEX", color: "#2C7DA0" },
  "LMDF": { label: "LMDF", color: "#468FAF" },
  "ASH VEENIER": { label: "ASH VEENIER", color: "#61A5C2" },
  sheets: { label: "Sheets", color: "#89C2D9" },
  uncategorized: { label: "Uncategorized", color: "#A9D6E5" },
  new: { label: "New", color: "#013A63" },
  electronics: { label: "Electronics", color: "#2A6F97" },
  plus: { label: "Plus", color: "#468FAF" },
}

export const salesChartConfig = {
  sales: {
    label: "Actual Sales",
    color: "#2A6F97",
  },
  target: {
    label: "Target",
    color: "#89C2D9",
  },
}

export const inventoryChartConfig = {
  stock: {
    label: "Current Stock",
    color: "#014F86",
  },
  sold: {
    label: "Units Sold",
    color: "#2A6F97",
  },
  reorderLevel: {
    label: "Reorder Level",
    color: "#012A4A",
  },
}
