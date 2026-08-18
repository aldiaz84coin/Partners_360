import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Small deterministic PRNG so demo data is stable across re-seeds.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260101);

const CATEGORIES = [
  { code: "REL", name: "Relationship & Collaboration", weight: 25, order: 1 },
  { code: "PER", name: "Performance & Delivery", weight: 25, order: 2 },
  { code: "BUS", name: "Business Value", weight: 20, order: 3 },
  { code: "INN", name: "Innovation & Strategic Alignment", weight: 20, order: 4 },
  { code: "RSK", name: "Risk & Governance", weight: 10, order: 5 },
] as const;

const ALL_ROLES = ["PRO", "VEN", "PRE", "DEL", "OPS", "OWN"] as const;
type Role = (typeof ALL_ROLES)[number];

type SeedQuestion = {
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

const ALL_QUESTIONS = [...CORE_QUESTIONS, ...STRATEGIC_QUESTIONS, ...SPECIFIC_QUESTIONS];

const DEMO_USERS: { email: string; name: string; role: Role }[] = [
  { email: "producto@partners360.local", name: "Ana Producto", role: "PRO" },
  { email: "ventas@partners360.local", name: "Luis Ventas", role: "VEN" },
  { email: "preventa@partners360.local", name: "Marta Preventa", role: "PRE" },
  { email: "delivery@partners360.local", name: "Carlos Delivery", role: "DEL" },
  { email: "operaciones@partners360.local", name: "Sofía Operaciones", role: "OPS" },
  { email: "owner@partners360.local", name: "Elena Owner", role: "OWN" },
];

const DEMO_PARTNERS = [
  { key: "technova", name: "TechNova Solutions", description: "Partner tecnológico estratégico — infraestructura cloud y datos." },
  { key: "cloudbridge", name: "CloudBridge Systems", description: "Partner de integración y soporte operativo." },
] as const;

// Baseline 1-5 score per category, used to synthesize a realistic-looking closed period.
const BASELINES: Record<(typeof DEMO_PARTNERS)[number]["key"], Record<string, number>> = {
  technova: { REL: 4.3, PER: 4.1, BUS: 4.0, INN: 4.4, RSK: 3.8 },
  cloudbridge: { REL: 3.2, PER: 2.9, BUS: 3.4, INN: 2.7, RSK: 2.5 },
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function draw(baseline: number) {
  const noise = (rand() - 0.5) * 1.6;
  return clamp(Math.round(baseline + noise), 1, 5);
}

async function main() {
  console.log("Seeding categories...");
  const categoryByCode = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { code: c.code },
      update: { name: c.name, weight: c.weight, order: c.order },
      create: c,
    });
    categoryByCode.set(c.code, cat.id);
  }

  console.log("Seeding questions...");
  const questionByCode = new Map<string, string>();
  for (const q of ALL_QUESTIONS) {
    const categoryId = categoryByCode.get(q.category);
    if (!categoryId) throw new Error(`Unknown category ${q.category}`);
    const question = await prisma.question.upsert({
      where: { code: q.code },
      update: { text: q.text, categoryId, scope: q.scope, order: q.order, active: true },
      create: { code: q.code, text: q.text, categoryId, scope: q.scope, order: q.order },
    });
    questionByCode.set(q.code, question.id);

    for (const aud of q.audiences) {
      await prisma.questionAudience.upsert({
        where: { questionId_stakeholderRole: { questionId: question.id, stakeholderRole: aud.role } },
        update: { required: aud.required },
        create: { questionId: question.id, stakeholderRole: aud.role, required: aud.required },
      });
    }
  }

  console.log("Seeding users...");
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "Partner123!";

  const admin = await prisma.user.upsert({
    where: { email: "admin@partners360.local" },
    update: {},
    create: {
      email: "admin@partners360.local",
      name: "Administrador",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      systemRole: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "direccion@partners360.local" },
    update: {},
    create: {
      email: "direccion@partners360.local",
      name: "Dirección (solo lectura)",
      passwordHash: await bcrypt.hash(demoPassword, 12),
      systemRole: "VIEWER",
    },
  });

  const usersByRole = new Map<Role, string>();
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        passwordHash: await bcrypt.hash(demoPassword, 12),
        systemRole: "EVALUATOR",
      },
    });
    usersByRole.set(u.role, user.id);
  }

  console.log("Seeding partners & assignments...");
  const partnerByKey = new Map<string, string>();
  for (const p of DEMO_PARTNERS) {
    const existing = await prisma.partner.findFirst({ where: { name: p.name } });
    const partner = existing ?? (await prisma.partner.create({ data: { name: p.name, description: p.description } }));
    partnerByKey.set(p.key, partner.id);

    for (const role of ALL_ROLES) {
      const userId = usersByRole.get(role)!;
      await prisma.partnerAssignment.upsert({
        where: { partnerId_userId_stakeholderRole: { partnerId: partner.id, userId, stakeholderRole: role } },
        update: { active: true },
        create: { partnerId: partner.id, userId, stakeholderRole: role },
      });
    }
  }

  console.log("Seeding periods...");
  const closedPeriod = await prisma.period.upsert({
    where: { label: "2025-Q4" },
    update: {},
    create: {
      label: "2025-Q4",
      startDate: new Date("2025-10-01"),
      endDate: new Date("2025-12-31"),
      status: "CLOSED",
    },
  });
  const priorPeriod = await prisma.period.upsert({
    where: { label: "2025-Q3" },
    update: {},
    create: {
      label: "2025-Q3",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2025-09-30"),
      status: "CLOSED",
    },
  });
  const openPeriod = await prisma.period.upsert({
    where: { label: "2026-Q1" },
    update: {},
    create: {
      label: "2026-Q1",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-03-31"),
      status: "OPEN",
    },
  });

  console.log("Seeding demo evaluations & answers...");
  const questionAudienceCache = new Map<string, { questionId: string; category: string }[]>();
  async function questionsFor(role: Role) {
    if (questionAudienceCache.has(role)) return questionAudienceCache.get(role)!;
    const audiences = await prisma.questionAudience.findMany({
      where: { stakeholderRole: role },
      include: { question: true },
    });
    const list = audiences
      .filter((a) => a.question.active)
      .map((a) => ({ questionId: a.questionId, category: a.question.categoryId }));
    questionAudienceCache.set(role, list);
    return list;
  }

  const categoryIdToCode = new Map(Array.from(categoryByCode.entries()).map(([code, id]) => [id, code]));

  async function seedEvaluation(
    partnerKey: (typeof DEMO_PARTNERS)[number]["key"],
    periodId: string,
    role: Role,
    submitted: boolean,
    baselineShift = 0
  ) {
    const partnerId = partnerByKey.get(partnerKey)!;
    const userId = usersByRole.get(role)!;
    const evaluation = await prisma.evaluation.upsert({
      where: { partnerId_periodId_userId_stakeholderRole: { partnerId, periodId, userId, stakeholderRole: role } },
      update: {},
      create: {
        partnerId,
        periodId,
        userId,
        stakeholderRole: role,
        status: submitted ? "SUBMITTED" : "DRAFT",
        submittedAt: submitted ? new Date() : null,
      },
    });

    const qs = await questionsFor(role);
    for (const q of qs) {
      const categoryCode = categoryIdToCode.get(q.category)!;
      const baseline = BASELINES[partnerKey][categoryCode] + baselineShift;
      await prisma.answer.upsert({
        where: { evaluationId_questionId: { evaluationId: evaluation.id, questionId: q.questionId } },
        update: {},
        create: { evaluationId: evaluation.id, questionId: q.questionId, value: draw(baseline) },
      });
    }
  }

  for (const p of DEMO_PARTNERS) {
    for (const role of ALL_ROLES) {
      await seedEvaluation(p.key, priorPeriod.id, role, true, -0.3);
      await seedEvaluation(p.key, closedPeriod.id, role, true, 0);
    }
  }
  // Leave 2026-Q1 mostly pending, but give TechNova's Partner Owner a submitted
  // evaluation so the "open period" dashboard view isn't completely empty.
  await seedEvaluation("technova", openPeriod.id, "OWN", true, 0.1);

  console.log("Seed complete.");
  console.log(`Admin login: admin@partners360.local / ${adminPassword}`);
  console.log(`Demo users password: ${demoPassword}`);
  console.log(`(Admin user id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
