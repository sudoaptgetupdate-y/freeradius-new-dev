// freeradius-backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { COMMON_ATTRIBUTES } = require('../src/config/radiusAttributes');

const prisma = new PrismaClient();

async function main() {
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || "admin";
  const DEFAULT_PROFILE_NAME = "default-profile";

  const DEFAULT_TERMS_OF_SERVICE = `📘 ข้อปฏิบัติในการใช้งานอินเทอร์เน็ต

            ผู้ใช้งานต้องใช้งานอินเทอร์เน็ตด้วยความรับผิดชอบ และ ห้ามกระทำการที่ผิดกฎหมายหรือกระทบต่อผู้อื่น โดยเฉพาะตามที่ระบุไว้ด้านล่างนี้
🚫 1. ห้ามกระทำผิดตาม พ.ร.บ. คอมพิวเตอร์ พ.ศ. 2560
        🔐 เข้าถึงระบบหรือข้อมูลของผู้อื่นโดยไม่ได้รับอนุญาต
        🧨 แก้ไข ดัดแปลง หรือทำลายข้อมูลของผู้อื่น
        📣 เผยแพร่ข้อมูลเท็จ บิดเบือน หรือหลอกลวง
        🔞 เผยแพร่ภาพลามก อนาจาร หรือเนื้อหาที่ไม่เหมาะสม
        📧 ส่งสแปม (Spam), ข้อความรบกวน หรือพฤติกรรมรุกล้ำความเป็นส่วนตัว
🧾 2. ห้ามละเมิดลิขสิทธิ์
        🎵 ดาวน์โหลดหรือเผยแพร่เพลง, วิดีโอ, ซอฟต์แวร์ หรือเนื้อหาที่มีลิขสิทธิ์โดยไม่ได้รับอนุญาต
💣 3. ห้ามกระทำการที่เป็นอันตรายต่อระบบเครือข่าย
        🛡️ โจมตีระบบเครือข่าย (เช่น DDoS)
        🔍 สแกนพอร์ต หรือพยายามค้นหาช่องโหว่
        🧬 เจาะระบบ หรือใช้เครื่องมือ Hack / Exploit ใด ๆ
🔑 4. ห้ามแชร์บัญชีผู้ใช้งานหรือรหัสผ่าน
        👤 บัญชีผู้ใช้เป็นสิทธิ์เฉพาะบุคคล ห้ามส่งต่อให้ผู้อื่น
        📌 ผู้ใช้งานต้องรับผิดชอบต่อกิจกรรมที่เกิดขึ้นภายใต้บัญชีของตนเอง
📂 5. ยินยอมให้เก็บบันทึกการใช้งาน (Log)
        🗂️ ระบบอาจจัดเก็บข้อมูลการใช้งานอินเทอร์เน็ตตามที่กฎหมายกำหนด
        🕵️ เจ้าหน้าที่มีสิทธิเข้าตรวจสอบ log หากเกิดเหตุจำเป็นหรือมีคำร้องขอจากหน่วยงานของรัฐ`

  console.log('Start seeding ...');

  // --- 1. Seed Super Administrator ---
  const existingAdmin = await prisma.administrator.findUnique({ where: { username: ADMIN_USERNAME } });
  if (!existingAdmin) {
    console.log(`👤 Creating Superadmin user: ${ADMIN_USERNAME}`);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);
    await prisma.administrator.create({
      data: {
        username: ADMIN_USERNAME,
        password: hashedPassword,
        role: "superadmin",
        fullName: "Super Administrator",
        email: `${ADMIN_USERNAME}@example.com`,
        phoneNumber: "0812345678"
      },
    });
    console.log(`✅ Superadmin created.`);
  } else {
    console.log(`👍 Superadmin already exists.`);
  }

  // --- 2. Seed Default Radius Profile ---
  console.log(`Seeding profile: ${DEFAULT_PROFILE_NAME}`);
  const defaultProfile = await prisma.RadiusProfile.upsert({
    where: { name: DEFAULT_PROFILE_NAME },
    update: {},
    create: { name: DEFAULT_PROFILE_NAME, description: 'Default profile' }
  });
  console.log(`- Profile '${defaultProfile.name}' is ready.`);

  // --- 3. Seed Basic Organizations ---
  console.log('Seeding basic organizations...');
  const organizationsToSeed = [
    { name: 'Register', login_identifier_type: 'manual' },
    { name: 'Voucher', login_identifier_type: 'manual' },
    { name: 'สร้างผู้ใช้ด้วยตัวเอง', login_identifier_type: 'manual' },
    { name: 'บัตรประชาชน', login_identifier_type: 'national_id' },
    { name: 'พนักงานบริษัท', login_identifier_type: 'employee_id' },
    { name: 'บุคลากรครู', login_identifier_type: 'employee_id' },
    { name: 'นักเรียน', login_identifier_type: 'student_id' }
  ];
  for (const org of organizationsToSeed) {
    await prisma.organization.upsert({
      where: { name: org.name },
      update: {},
      create: { ...org, radiusProfileId: defaultProfile.id },
    });
    console.log(`- Organization '${org.name}' is ready.`);
  }

  // --- 4. Seed Default Settings ---
  console.log('Seeding default settings...');
  const settingsToSeed = [
      // --- START: เพิ่ม appName ---
      { key: 'appName', value: 'Freeradius UI' },
      // --- END ---
      { key: 'terms', value: DEFAULT_TERMS_OF_SERVICE },
      { key: 'logoUrl', value: '/uploads/nt-logo.png' },
      { key: 'backgroundUrl', value: '/uploads/nt-background.png' },
      { key: 'voucherLogoUrl', value: '/uploads/nt-voucherLogo.png' },
      { key: 'registrationEnabled', value: 'false' },
      { key: 'externalLoginEnabled', value: 'false' },
      { key: 'initialUserStatus', value: 'registered' }
  ];

  for (const setting of settingsToSeed) {
      const existingSetting = await prisma.setting.findUnique({ where: { key: setting.key } });
      if (!existingSetting) {
          await prisma.setting.create({
              data: {
                  key: setting.key,
                  value: setting.value,
              },
          });
          console.log(`✅ Default setting for '${setting.key}' created.`);
      } else {
          await prisma.setting.update({
              where: { key: setting.key },
              data: { value: setting.value },
          });
          console.log(`👍 Default setting for '${setting.key}' updated.`);
      }
  }

  // --- 5. Seed Default Radius Attributes ---
  console.log('Seeding default RADIUS attributes...');
  const allAttributes = [
    ...COMMON_ATTRIBUTES.reply.map(attr => ({ ...attr, type: 'reply' })),
    ...COMMON_ATTRIBUTES.check.map(attr => ({ ...attr, type: 'check' }))
  ];
  for (const attr of allAttributes) {
    await prisma.radiusAttributeDefinition.upsert({
      where: { name: attr.name },
      update: { description: attr.description, type: attr.type },
      create: { name: attr.name, description: attr.description, type: attr.type },
    });
  }
  console.log('✅ Default RADIUS attributes are ready.');

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