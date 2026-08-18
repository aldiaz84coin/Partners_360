// Hardcoded (not CSS vars) since these feed SVG fill attributes in recharts.
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];

export const CATEGORY_COLORS: Record<string, string> = {
  REL: SERIES[0],
  PER: SERIES[1],
  BUS: SERIES[2],
  INN: SERIES[3],
  RSK: SERIES[4],
};

export const ROLE_COLORS: Record<string, string> = {
  PRO: SERIES[0],
  VEN: SERIES[1],
  PRE: SERIES[2],
  DEL: SERIES[3],
  OPS: SERIES[4],
  OWN: SERIES[5],
};

export const ROLE_LABEL: Record<string, string> = {
  PRO: "Producto",
  VEN: "Ventas",
  PRE: "Preventa",
  DEL: "Delivery",
  OPS: "Operaciones",
  OWN: "Partner Owner",
};
