// src/services/attributeDefinitionService.js
const prisma = require('../prisma');

const getAll = () => {
  return prisma.radiusAttributeDefinition.findMany({
    orderBy: {
      name: 'asc',
    },
  });
};

const create = (data) => {
  const { name, description, type } = data;
  if (!name || !type) {
    throw new Error('Attribute name and type are required.');
  }
  return prisma.radiusAttributeDefinition.create({ data });
};

const update = (id, data) => {
  return prisma.radiusAttributeDefinition.update({
    where: { id: parseInt(id, 10) },
    data,
  });
};

const remove = (id) => {
  return prisma.radiusAttributeDefinition.delete({
    where: { id: parseInt(id, 10) },
  });
};

module.exports = { getAll, create, update, remove };