// Production bootstrap: makes a freshly-migrated database usable.
//
// Runs on every container start (see scripts/start.sh), so it must be strictly
// idempotent and must never create demo content. It only ensures the things the
// app cannot function without:
//
//   1. The five Partner 360 categories and the question bank (the framework
//      itself — without these there is nothing to answer or score).
//   2. One admin account, so someone can actually log in. Created only when no
//      admin exists yet; an existing admin's password is never overwritten.
//
// Demo partners, evaluators and sample evaluations live in prisma/seed.ts and
// are opt-in.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { CATEGORIES, ALL_QUESTIONS, DEFAULT_TECHNOLOGIES } from "./framework-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function syncFramework() {
  const categoryByCode = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { code: c.code },
      // Weights are editable from /admin, so don't clobber them on restart —
      // only the name and ordering are kept in sync with the code.
      update: { name: c.name, order: c.order },
      create: c,
    });
    categoryByCode.set(c.code, cat.id);
  }

  let created = 0;
  for (const q of ALL_QUESTIONS) {
    const categoryId = categoryByCode.get(q.category);
    if (!categoryId) throw new Error(`Unknown category ${q.category} for question ${q.code}`);

    const existing = await prisma.question.findUnique({ where: { code: q.code } });
    if (existing) continue; // questions are editable from /admin — never overwrite
    created++;

    const question = await prisma.question.create({
      data: { code: q.code, text: q.text, categoryId, scope: q.scope, order: q.order },
    });
    await prisma.questionAudience.createMany({
      data: q.audiences.map((a) => ({
        questionId: question.id,
        stakeholderRole: a.role,
        required: a.required,
      })),
    });
  }
  console.log(
    `[bootstrap] Framework ready: ${CATEGORIES.length} categories, ${ALL_QUESTIONS.length} questions (${created} new).`
  );
}

async function syncTechnologies() {
  let created = 0;
  for (let i = 0; i < DEFAULT_TECHNOLOGIES.length; i++) {
    const name = DEFAULT_TECHNOLOGIES[i];
    const existing = await prisma.technology.findUnique({ where: { name } });
    if (existing) continue; // editable from /admin/technologies — never overwrite
    created++;
    await prisma.technology.create({ data: { name, order: i } });
  }
  console.log(`[bootstrap] Technology catalog ready: ${DEFAULT_TECHNOLOGIES.length} tags (${created} new).`);
}

async function ensureAdmin() {
  const existingAdmin = await prisma.user.findFirst({ where: { systemRole: "ADMIN" } });
  if (existingAdmin) {
    console.log(`[bootstrap] Admin already present (${existingAdmin.email}); leaving it untouched.`);
    return;
  }

  const email = (process.env.ADMIN_EMAIL ?? "admin@partners360.local").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error(
      "[bootstrap] No admin user exists and ADMIN_PASSWORD is not set, so nobody can log in.\n" +
        "[bootstrap] Set it once with: fly secrets set ADMIN_PASSWORD='...' ADMIN_EMAIL='you@example.com'"
    );
    throw new Error("Cannot create the initial admin user without ADMIN_PASSWORD");
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  await prisma.user.create({
    data: {
      email,
      name: process.env.ADMIN_NAME ?? "Administrador",
      passwordHash: await bcrypt.hash(password, 12),
      systemRole: "ADMIN",
    },
  });
  console.log(`[bootstrap] Created initial admin user: ${email}`);
}

async function main() {
  await syncFramework();
  await syncTechnologies();
  await ensureAdmin();
}

main()
  .catch((e) => {
    console.error("[bootstrap] FAILED:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
