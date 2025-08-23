// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  // Backend สำหรับโหลดไฟล์ translation.json จากโฟลเดอร์ public
  .use(HttpApi)
  // ตรวจจับภาษาของผู้ใช้จาก browser
  .use(LanguageDetector)
  // เชื่อมต่อ i18n เข้ากับ React
  .use(initReactI18next)
  .init({
    // ภาษาที่รองรับ
    supportedLngs: ['en', 'th'],
    // ภาษาเริ่มต้น หากตรวจไม่พบภาษาที่รองรับ
    fallbackLng: 'en',
    // การตั้งค่าสำหรับ LanguageDetector
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'], // บันทึกภาษาที่ผู้ใช้เลือกลงใน localStorage
    },
    // กำหนด path ไปยังไฟล์ภาษา
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    // react-i18next จะ escape ค่าโดยอัตโนมัติ ไม่จำเป็นต้องทำซ้ำ
    interpolation: {
      escapeValue: false,
    },
    // เปิด debug mode ใน development
    debug: process.env.NODE_ENV === 'development',
  });

export default i18n;