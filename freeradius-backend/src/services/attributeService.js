// src/services/attributeService.js
const prisma = require('../prisma');

const addAttribute = async (profileName, type, data) => {
  const { attribute, op, value } = data;
  
  // เลือก Model ที่จะทำงานด้วย (RadGroupReply หรือ RadGroupCheck)
  const model = type === 'reply' ? prisma.RadGroupReply : prisma.RadGroupCheck;

  return model.create({
    data: {
      groupname: profileName,
      attribute,
      op,
      value,
    },
  });
};

const deleteAttribute = async (attributeId, type) => {
  const model = type === 'reply' ? prisma.RadGroupReply : prisma.RadGroupCheck;
  
  return model.delete({
    where: { id: parseInt(attributeId) },
  });
};

module.exports = {
  addAttribute,
  deleteAttribute,
};