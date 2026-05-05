import { prisma } from "./client";
import bcrypt from "bcryptjs";
import { slugifyVi, sha256Normalized, chapterSlug } from "@story-crawler/core";

async function seedUsers() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@tramtuyen.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";
  const editorEmail = process.env.EDITOR_EMAIL ?? "editor@tramtuyen.local";
  const editorPassword = process.env.EDITOR_PASSWORD ?? "changeme123";

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const editorHash = await bcrypt.hash(editorPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, role: "ADMIN" },
    create: { email: adminEmail, passwordHash: adminHash, role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: editorEmail },
    update: { passwordHash: editorHash, role: "EDITOR" },
    create: { email: editorEmail, passwordHash: editorHash, role: "EDITOR" },
  });
}

async function seedAuthorsGenres() {
  const genres = [
    "Tiên hiệp",
    "Đô thị",
    "Cổ điển",
    "Thiếu nhi",
    "Khoa học viễn tưởng",
  ];
  for (const name of genres) {
    await prisma.genre.upsert({
      where: { slug: slugifyVi(name) },
      update: {},
      create: { name, slug: slugifyVi(name) },
    });
  }
  const authors = [
    "Tô Hoài",
    "Nguyễn Du",
    "Vũ Trọng Phụng",
    "Nam Cao",
    "Hồ Anh Thái",
  ];
  for (const name of authors) {
    await prisma.author.upsert({
      where: { slug: slugifyVi(name) },
      update: {},
      create: { name, slug: slugifyVi(name) },
    });
  }
}

async function seedSources() {
  const items = [
    {
      name: "Mock Fixture",
      adapterKey: "mock-fixture",
      baseUrl: "https://mock.local",
      licenseMode: "MOCK" as const,
    },
    {
      name: "Wikisource VI",
      adapterKey: "gutenberg-vi",
      baseUrl: "https://vi.wikisource.org",
      licenseMode: "FULL" as const,
    },
    {
      name: "Metadata Demo",
      adapterKey: "metadata-only-demo",
      baseUrl: "https://example.com",
      licenseMode: "METADATA_ONLY" as const,
    },
  ];
  for (const it of items) {
    await prisma.source.upsert({
      where: { adapterKey: it.adapterKey },
      update: {},
      create: { ...it, enabled: true },
    });
  }
}

async function seedSampleStory() {
  const author = await prisma.author.findUnique({
    where: { slug: slugifyVi("Tô Hoài") },
  });
  if (!author) return;
  const slug = slugifyVi("De men phieu luu ky");
  const exists = await prisma.story.findUnique({ where: { slug } });
  if (exists) return;

  const story = await prisma.story.create({
    data: {
      title: "Dế mèn phiêu lưu ký",
      slug,
      authorId: author.id,
      description:
        "Tác phẩm thiếu nhi kinh điển — sample seed. Toàn bộ chương ở trạng thái PUBLISHED để demo public site.",
      storyStatus: "COMPLETED",
      licenseStatus: "PUBLIC_DOMAIN",
    },
  });
  const childGenre = await prisma.genre.findUnique({
    where: { slug: slugifyVi("Thiếu nhi") },
  });
  if (childGenre) {
    await prisma.storyGenre.upsert({
      where: { storyId_genreId: { storyId: story.id, genreId: childGenre.id } },
      update: {},
      create: { storyId: story.id, genreId: childGenre.id },
    });
  }

  const chapters = [
    {
      number: 1,
      title: "Tôi sống bên bờ ruộng",
      content:
        "Tôi sống độc lập từ thuở bé. Ấy là tục lệ lâu đời trong họ nhà dế chúng tôi. Vả lại, mẹ thường bảo, sống một mình cho biết tự lập.",
    },
    {
      number: 2,
      title: "Dế Choắt và bài học",
      content:
        "Dế Choắt — anh hàng xóm gầy gò ấy — luôn nhường nhịn. Cho đến hôm tôi trêu chị Cốc, bài học đầu đời mới khắc sâu vào tôi như tiếng kêu cuối cùng của người bạn nhỏ.",
    },
    {
      number: 3,
      title: "Lên đường",
      content:
        "Sáng hôm sau, tôi gói ghém vài hạt thóc, từ giã ngôi nhà nhỏ và bắt đầu chuyến phiêu lưu — để học, để sửa, để lớn lên.",
    },
  ];
  for (const ch of chapters) {
    await prisma.chapter.create({
      data: {
        storyId: story.id,
        number: ch.number,
        title: ch.title,
        slug: chapterSlug(ch.title, ch.number),
        content: ch.content,
        contentHash: sha256Normalized(ch.content),
        publishStatus: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed disabled in production");
  }
  await seedUsers();
  await seedAuthorsGenres();
  await seedSources();
  await seedSampleStory();
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.author.count(),
    prisma.genre.count(),
    prisma.source.count(),
    prisma.story.count(),
    prisma.chapter.count(),
  ]);
  console.log(
    "[seed] users=%d authors=%d genres=%d sources=%d stories=%d chapters=%d",
    ...counts,
  );
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
