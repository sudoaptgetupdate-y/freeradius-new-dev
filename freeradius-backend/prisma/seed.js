const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "admin";
  const DEFAULT_PROFILE_NAME = "default-profile";

  console.log('Start seeding ...');

  // --- 1. Seed Super Administrator ---
  console.log(`Seeding superadmin user: ${ADMIN_USERNAME}`);
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);
  
  await prisma.Administrator.upsert({
    where: { username: ADMIN_USERNAME },
    update: {
      password: hashedPassword,
    },
    create: {
      username: ADMIN_USERNAME,
      password: hashedPassword,
      role: "superadmin",
      fullName: "Super Administrator",
      email: `${ADMIN_USERNAME}@example.com`,
      phoneNumber: "0812345678"
    },
  });
  console.log(`Superadmin user '${ADMIN_USERNAME}' is ready.`);


  // --- 2. Seed Default Radius Profile ---
  console.log(`Seeding profile: ${DEFAULT_PROFILE_NAME}`);
  
  // ใช้ .upsert เพื่อสร้างถ้ายังไม่มี หรืออัปเดตถ้ามีอยู่แล้ว (ทำให้รันซ้ำได้)
  await prisma.RadiusProfile.upsert({
    where: { name: DEFAULT_PROFILE_NAME },
    update: {}, // ไม่ต้องอัปเดตอะไรถ้าเจอ
    create: {
      name: DEFAULT_PROFILE_NAME,
      description: 'Default profile with basic access rules',
      // สร้าง Attributes ที่ผูกกันไปพร้อมกันเลย
      replyAttributes: {
        create: [
          { groupname: DEFAULT_PROFILE_NAME, attribute: 'Session-Timeout', op: ':=', value: '28800' }, // 8 hours
        ]
      },
      checkAttributes: {
        create: [
          { groupname: DEFAULT_PROFILE_NAME, attribute: 'Simultaneous-Use', op: ':=', value: '1' }, // 1 concurrent session
        ]
      }
    }
  });
  console.log(`Profile '${DEFAULT_PROFILE_NAME}' is ready.`);
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });