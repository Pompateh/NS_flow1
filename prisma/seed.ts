import { PrismaClient, AssetType, ProjectStatus, Role } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminUsername = "newstalgia39";
  const adminPassword = "justdoit";
  const memberUsername = "nsgstaff";
  const memberPassword = "justdo";

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const memberPasswordHash = await bcrypt.hash(memberPassword, 10);

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      role: Role.ADMIN,
      name: "Admin",
      passwordHash: adminPasswordHash,
    },
    create: {
      username: adminUsername,
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      name: "Admin",
    },
  });

  const member = await prisma.user.upsert({
    where: { username: memberUsername },
    update: {
      role: Role.MEMBER,
      name: "Member",
      passwordHash: memberPasswordHash,
    },
    create: {
      username: memberUsername,
      passwordHash: memberPasswordHash,
      role: Role.MEMBER,
      name: "Member",
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project" },
    update: {
      name: "Brand Launch Moodboard",
      status: ProjectStatus.ACTIVE,
    },
    create: {
      id: "seed-project",
      name: "Brand Launch Moodboard",
      status: ProjectStatus.ACTIVE,
      members: {
        create: [{ userId: admin.id }, { userId: member.id }],
      },
      steps: {
        create: [
          {
            order: 1,
            title: "Direction",
            content:
              "Overall vibe: bold, minimal, warm neutrals.\n\nTypography: geometric sans.\n\nImagery: high-contrast product shots.",
            assets: {
              create: [
                {
                  type: AssetType.IMAGE,
                  url: "https://picsum.photos/seed/dir/1200/800",
                  filename: "direction.jpg",
                },
              ],
            },
          },
          {
            order: 2,
            title: "Palette",
            content:
              "Primary: #111111\nSecondary: #EAE7DC\nAccent: #C96A3A",
          },
          {
            order: 3,
            title: "References",
            content:
              "Downloadables are listed below. Members can download originals.",
            assets: {
              create: [
                {
                  type: AssetType.FILE,
                  url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                  filename: "reference.pdf",
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.projectMember.upsert({
    where: {
      userId_projectId: {
        userId: member.id,
        projectId: project.id,
      },
    },
    update: {},
    create: { userId: member.id, projectId: project.id },
  });

  await prisma.projectMember.upsert({
    where: {
      userId_projectId: {
        userId: admin.id,
        projectId: project.id,
      },
    },
    update: {},
    create: { userId: admin.id, projectId: project.id },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
