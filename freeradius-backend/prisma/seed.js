const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { COMMON_ATTRIBUTES } = require('../src/config/radiusAttributes');

const prisma = new PrismaClient();

async function main() {
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "admin";
  const DEFAULT_PROFILE_NAME = "default-profile";
  const REGISTER_ORG_NAME = "Register";
  const VOUCHER_ORG_NAME = "Voucher";

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
  
  const defaultProfile = await prisma.RadiusProfile.upsert({
    where: { name: DEFAULT_PROFILE_NAME },
    update: {},
    create: {
      name: DEFAULT_PROFILE_NAME,
      description: 'Default profile with basic access rules',
      replyAttributes: {
        create: [
          // --- START: แก้ไขส่วนนี้ (ลบ groupname ออก) ---
          { attribute: 'Session-Timeout', op: ':=', value: '28800' },
          // --- END ---
        ]
      },
      checkAttributes: {
        create: [
          // --- START: แก้ไขส่วนนี้ (ลบ groupname ออก) ---
          { attribute: 'Simultaneous-Use', op: ':=', value: '1' },
          // --- END ---
        ]
      }
    }
  });
  console.log(`Profile '${DEFAULT_PROFILE_NAME}' is ready.`);

  // --- 3. Seed Register Organization ---
  console.log(`Seeding organization: ${REGISTER_ORG_NAME}`);
  await prisma.organization.upsert({
      where: { name: REGISTER_ORG_NAME },
      update: {},
      create: {
          name: REGISTER_ORG_NAME,
          login_identifier_type: 'manual',
          radiusProfileId: defaultProfile.id,
      },
  });
  console.log(`Organization '${REGISTER_ORG_NAME}' is ready.`);

  console.log(`Seeding organization: ${VOUCHER_ORG_NAME}`);
  await prisma.organization.upsert({
      where: { name: VOUCHER_ORG_NAME },
      update: {},
      create: {
          name: VOUCHER_ORG_NAME,
          login_identifier_type: 'manual', // ผู้ใช้บัตรเป็นแบบ manual username
          radiusProfileId: defaultProfile.id, // ใช้โปรไฟล์เริ่มต้นเดียวกัน
      },
  });
  console.log(`Organization '${VOUCHER_ORG_NAME}' is ready.`);
  
  // --- 4. Seed Default Radius Attributes ---
  console.log('Seeding default RADIUS attributes...');
  
  const allAttributes = [];
  
  COMMON_ATTRIBUTES.reply.forEach(attr => {
    allAttributes.push({ ...attr, type: 'reply' });
  });

  COMMON_ATTRIBUTES.check.forEach(attr => {
    allAttributes.push({ ...attr, type: 'check' });
  });

  await Promise.all(
    allAttributes.map(attr => 
      prisma.radiusAttributeDefinition.upsert({
        where: { name: attr.name },
        update: {
            description: attr.description,
            type: attr.type,
        }, 
        create: {
          name: attr.name,
          description: attr.description,
          type: attr.type,
        },
      })
    )
  );
  console.log('Default RADIUS attributes are ready.');

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