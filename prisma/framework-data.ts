// Shared definitions of the Partner 360 framework itself: the five weighted
// categories and the full question bank (core + strategic + role-specific),
// with the ●/○ audience matrix per stakeholder role.
//
// Imported by both prisma/bootstrap.ts (applied on every deploy, so a fresh
// database is usable immediately) and prisma/seed.ts (which adds demo data on
// top). Keep this file free of demo content and of any Prisma client import.

export const CATEGORIES = [
  { code: "REL", name: "Relationship & Collaboration", weight: 25, order: 1 },
  { code: "PER", name: "Performance & Delivery", weight: 25, order: 2 },
  { code: "BUS", name: "Business Value", weight: 20, order: 3 },
  { code: "INN", name: "Innovation & Strategic Alignment", weight: 20, order: 4 },
  { code: "RSK", name: "Risk & Governance", weight: 10, order: 5 },
] as const;

export const ALL_ROLES = ["PRO", "VEN", "PRE", "DEL", "OPS", "OWN"] as const;
export type Role = (typeof ALL_ROLES)[number];

/// Starter tag catalog for the Technology multi-select on partners. Just a
/// sensible default so the picker isn't empty on a fresh deploy — the list is
/// fully editable from /admin/technologies afterwards.
export const DEFAULT_TECHNOLOGIES = [
  "RPA",
  "IA / Machine Learning",
  "iPaaS / Integración",
  "BPM",
  "Low-code / No-code",
  "Cloud / Infraestructura",
  "Ciberseguridad",
  "Data & Analytics",
  "IoT",
  "ERP / CRM",
] as const;

export type SeedQuestion = {
  code: string;
  text: string;
  category: string;
  scope: "CORE" | "SPECIFIC" | "STRATEGIC";
  order: number;
  audiences: { role: Role; required: boolean }[];
};

const ALL_AUDIENCE = ALL_ROLES.map((role) => ({ role, required: true }));
// Business is only a secondary/optional concern for PRE, DEL and OPS (matrix in the spec).
const CORE_BUSINESS_AUDIENCE = ALL_ROLES.map((role) => ({
  role,
  required: !(["PRE", "DEL", "OPS"] as Role[]).includes(role),
}));

const CORE_QUESTIONS: SeedQuestion[] = [
  { code: "REL-1", text: "La comunicación con el partner es clara, fluida y oportuna.", category: "REL", scope: "CORE", order: 1, audiences: ALL_AUDIENCE },
  { code: "REL-2", text: "El partner actúa de forma proactiva y genera confianza en la relación.", category: "REL", scope: "CORE", order: 2, audiences: ALL_AUDIENCE },
  { code: "REL-3", text: "El partner resuelve conflictos de forma constructiva y se adapta a cambios de contexto.", category: "REL", scope: "CORE", order: 3, audiences: ALL_AUDIENCE },
  { code: "PER-1", text: "La calidad del trabajo entregado por el partner cumple con lo esperado.", category: "PER", scope: "CORE", order: 4, audiences: ALL_AUDIENCE },
  { code: "PER-2", text: "El partner cumple los plazos y SLA acordados.", category: "PER", scope: "CORE", order: 5, audiences: ALL_AUDIENCE },
  { code: "PER-3", text: "El partner responde con rapidez y eficacia ante problemas o incidencias.", category: "PER", scope: "CORE", order: 6, audiences: ALL_AUDIENCE },
  { code: "BUS-1", text: "El partner genera valor tangible para el negocio y los clientes.", category: "BUS", scope: "CORE", order: 7, audiences: CORE_BUSINESS_AUDIENCE },
  { code: "BUS-2", text: "La relación coste/valor del partner es competitiva frente a alternativas del mercado.", category: "BUS", scope: "CORE", order: 8, audiences: CORE_BUSINESS_AUDIENCE },
  { code: "INN-1", text: "El partner aporta innovación y nuevas capacidades relevantes.", category: "INN", scope: "CORE", order: 9, audiences: ALL_AUDIENCE },
  { code: "INN-2", text: "El roadmap y la estrategia del partner están alineados con nuestras necesidades.", category: "INN", scope: "CORE", order: 10, audiences: ALL_AUDIENCE },
  { code: "RSK-1", text: "El partner cumple con los compromisos contractuales y de compliance.", category: "RSK", scope: "CORE", order: 11, audiences: ALL_AUDIENCE },
  { code: "RSK-2", text: "El nivel de dependencia y riesgo operativo asociado a este partner es aceptable.", category: "RSK", scope: "CORE", order: 12, audiences: ALL_AUDIENCE },
];

const STRATEGIC_QUESTIONS: SeedQuestion[] = [
  { code: "STR-1", text: "El partner demuestra capacidad de co-innovación y diferenciación frente a otros partners.", category: "INN", scope: "STRATEGIC", order: 1, audiences: ALL_AUDIENCE },
  { code: "STR-2", text: "A medio plazo, este partner representa un riesgo estratégico bajo para la continuidad del negocio.", category: "RSK", scope: "STRATEGIC", order: 2, audiences: ALL_AUDIENCE },
  { code: "STR-3", text: "Recomendaría mantener y ampliar la relación estratégica con este partner en los próximos 12 meses.", category: "REL", scope: "STRATEGIC", order: 3, audiences: ALL_AUDIENCE },
];

function specific(role: Role, order: number, code: string, text: string, category: string): SeedQuestion {
  return { code, text, category, scope: "SPECIFIC", order, audiences: [{ role, required: true }] };
}

const SPECIFIC_QUESTIONS: SeedQuestion[] = [
  specific("PRO", 1, "PRO-1", "El roadmap tecnológico del partner responde a nuestras necesidades de producto.", "INN"),
  specific("PRO", 2, "PRO-2", "El partner comparte visibilidad temprana sobre nuevas funcionalidades y capacidades.", "INN"),
  specific("PRO", 3, "PRO-3", "La documentación técnica y de producto del partner es completa y está actualizada.", "PER"),
  specific("PRO", 4, "PRO-4", "El partner facilita la co-innovación en el desarrollo de producto conjunto.", "INN"),

  specific("VEN", 1, "VEN-1", "El partner genera oportunidades comerciales de calidad.", "BUS"),
  specific("VEN", 2, "VEN-2", "El partner es competitivo en propuestas conjuntas frente a otras alternativas.", "BUS"),
  specific("VEN", 3, "VEN-3", "El partner apoya activamente al equipo comercial en el proceso de venta.", "REL"),
  specific("VEN", 4, "VEN-4", "El partner contribuye positivamente al crecimiento del negocio conjunto.", "BUS"),

  specific("PRE", 1, "PRE-1", "El partner ofrece soluciones técnicas viables y bien dimensionadas.", "PER"),
  specific("PRE", 2, "PRE-2", "El partner participa activamente en PoCs y pruebas de concepto cuando se requiere.", "PER"),
  specific("PRE", 3, "PRE-3", "La documentación técnica de preventa proporcionada por el partner es clara y suficiente.", "PER"),
  specific("PRE", 4, "PRE-4", "El partner responde con agilidad a las solicitudes de soporte en fase de preventa.", "PER"),

  specific("DEL", 1, "DEL-1", "El partner asigna los recursos adecuados para la correcta ejecución de los proyectos.", "PER"),
  specific("DEL", 2, "DEL-2", "La calidad de la implantación realizada por el partner cumple con los estándares esperados.", "PER"),
  specific("DEL", 3, "DEL-3", "El partner cumple los plazos comprometidos en los proyectos de implantación.", "PER"),
  specific("DEL", 4, "DEL-4", "El partner gestiona adecuadamente los riesgos durante la ejecución de los proyectos.", "RSK"),

  specific("OPS", 1, "OPS-1", "El partner cumple los SLA de soporte acordados.", "PER"),
  specific("OPS", 2, "OPS-2", "El partner resuelve incidencias de forma eficaz y en los plazos adecuados.", "PER"),
  specific("OPS", 3, "OPS-3", "La estabilidad y continuidad del servicio proporcionado por el partner es adecuada.", "RSK"),
  specific("OPS", 4, "OPS-4", "El partner comunica de forma proactiva incidencias y su plan de resolución.", "REL"),

  specific("OWN", 1, "OWN-1", "La relación global con el partner evoluciona de forma positiva.", "REL"),
  specific("OWN", 2, "OWN-2", "La estrategia del partner está alineada con nuestra estrategia de negocio a largo plazo.", "INN"),
  specific("OWN", 3, "OWN-3", "El nivel de gobernanza y gestión de riesgo de la relación es adecuado.", "RSK"),
  specific("OWN", 4, "OWN-4", "El valor global aportado por el partner justifica la inversión en la relación.", "BUS"),
];

export const ALL_QUESTIONS = [...CORE_QUESTIONS, ...STRATEGIC_QUESTIONS, ...SPECIFIC_QUESTIONS];
