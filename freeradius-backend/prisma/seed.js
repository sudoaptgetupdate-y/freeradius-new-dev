const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "admin";
  const DEFAULT_PROFILE_NAME = "default-profile";
  const REGISTER_ORG_NAME = "Register"; // 1. เพิ่มชื่อองค์กรใหม่

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
  
  const defaultProfile = await prisma.RadiusProfile.upsert({ // 2. เก็บผลลัพธ์ไว้ในตัวแปร
    where: { name: DEFAULT_PROFILE_NAME },
    update: {},
    create: {
      name: DEFAULT_PROFILE_NAME,
      description: 'Default profile with basic access rules',
      replyAttributes: {
        create: [
          { groupname: DEFAULT_PROFILE_NAME, attribute: 'Session-Timeout', op: ':=', value: '28800' },
        ]
      },
      checkAttributes: {
        create: [
          { groupname: DEFAULT_PROFILE_NAME, attribute: 'Simultaneous-Use', op: ':=', value: '1' },
        ]
      }
    }
  });
  console.log(`Profile '${DEFAULT_PROFILE_NAME}' is ready.`);

  // --- START: 3. Seed Register Organization ---
  console.log(`Seeding organization: ${REGISTER_ORG_NAME}`);
  await prisma.organization.upsert({
      where: { name: REGISTER_ORG_NAME },
      update: {},
      create: {
          name: REGISTER_ORG_NAME,
          login_identifier_type: 'manual',
          radiusProfileId: defaultProfile.id, // 3. ใช้ ID จาก Profile ที่สร้างไว้
      },
  });
  console.log(`Organization '${REGISTER_ORG_NAME}' is ready.`);
  // --- END: สิ้นสุดส่วนที่เพิ่ม ---
  
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