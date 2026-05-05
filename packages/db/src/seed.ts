import { prisma } from "./client.js";
import bcrypt from "bcryptjs";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed disabled in production");
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@tramtuyen.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";
  const editorEmail = process.env.EDITOR_EMAIL ?? "editor@tramtuyen.local";
  const editorPassword = process.env.EDITOR_PASSWORD ?? "changeme123";

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const editorHash = await bcrypt.hash(editorPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: "ADMIN" },
    create: { email: adminEmail, passwordHash: adminHash, role: "ADMIN" },
  });
  const editor = await prisma.user.upsert({
    where: { email: editorEmail },
    update: { passwordHash: editorHash, role: "EDITOR" },
    create: { email: editorEmail, passwordHash: editorHash, role: "EDITOR" },
  });

  console.log("[seed] users:", admin.email, editor.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
