// src/lib/radiusAttributes.js

// รายชื่อ Attributes ที่ใช้บ่อย
// เราสามารถมาเพิ่มได้อีกในอนาคต
export const COMMON_ATTRIBUTES = {
  reply: [
    { name: 'Session-Timeout', description: 'Max session time in seconds' },
    { name: 'Idle-Timeout', description: 'Disconnect if idle for seconds' },
    { name: 'WISPr-Bandwidth-Max-Up', description: 'Max upload speed in bits/sec' },
    { name: 'WISPr-Bandwidth-Max-Down', description: 'Max download speed in bits/sec' },
    { name: 'Acct-Interim-Interval', description: 'Interval for accounting updates in seconds' },
    { name: 'Reply-Message', description: 'A message to show to the user' },
  ],
  check: [
    { name: 'Simultaneous-Use', description: 'Max concurrent logins' },
    { name: 'Auth-Type', description: 'Force accept or reject' },
  ]
};

// Operator ที่ใช้ได้
export const OPERATORS = [":=", "=", "==", "+=", ">", ">=", "<", "<="];