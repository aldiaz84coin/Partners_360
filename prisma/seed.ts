import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { ALL_ROLES, CATEGORIES, ALL_QUESTIONS, type Role } from "./framework-data";

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
