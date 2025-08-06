const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "admin";

  console.log('Start seeding ...');

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);
  console.log(`Hashing password for user: ${ADMIN_USERNAME}`);

  await prisma.Administrator.deleteMany({
    where: {
      username: ADMIN_USERNAME,
    },
  });
  console.log(`Deleted existing user: ${ADMIN_USERNAME} if they existed.`);

  // สร้างผู้ใช้ใหม่พร้อมข้อมูล fullName และ email
  await prisma.Administrator.create({
    data: {
      username: ADMIN_USERNAME,
      password: hashedPassword,
      role: "superadmin",
      // --- เพิ่มข้อมูลใหม่ที่นี่ ---
      fullName: "Super Administrator",
      email: `${ADMIN_USERNAME}@example.com`,
      phoneNumber: "0812345678" // ตัวอย่าง
      // --------------------------
    },
  });
  console.log(`Created new superadmin user: ${ADMIN_USERNAME}`);
  
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