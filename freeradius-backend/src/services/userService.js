// freeradius-backend/src/services/userService.js

const prisma = require('../prisma');
const bcrypt = require('bcryptjs');

const createUserAndSync = async (userData, adminId) => {
  // ... (โค้ดส่วนนี้เหมือนเดิม ไม่มีการเปลี่ยนแปลง)
  const { 
    organizationId, 
    password, 
    full_name, 
    national_id, 
    employee_id, 
    student_id, 
    username: manualUsername 
  } = userData;

  if (!organizationId) {
    throw new Error('Organization ID is required.');
  }
  const organization = await prisma.organization.findUnique({
    where: { id: parseInt(organizationId, 10) },
    include: {
      radiusProfile: true, 
    },
  });

  if (!organization) throw new Error('Organization not found');
  if (!organization.radiusProfile) throw new Error('This organization does not have a Radius Profile assigned.');

  const profile_name = organization.radiusProfile.name;
  
  const { login_identifier_type } = organization;

  if (!password) throw new Error('Password is required.');
  if (!full_name) throw new Error('Full Name is required.');

  let username;
  switch (login_identifier_type) {
    case 'manual':
      if (!manualUsername) throw new Error('Username is required for manual type.');
      username = manualUsername;
      break;
    case 'national_id':
      if (!national_id) throw new Error('National ID is required for this organization type.');
      username = national_id;
      break;
    case 'employee_id':
      if (!employee_id) throw new Error('Employee ID is required for this organization type.');
      username = employee_id;
      break;
    case 'student_id':
      if (!student_id) throw new Error('Student ID is required for this organization type.');
      username = student_id;
      break;
    default:
      throw new Error('Invalid organization type.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.$transaction(async (tx) => {
    const cleanData = {
      organizationId: parseInt(organizationId, 10),
      username,
      password: hashedPassword,
      full_name,
      national_id: national_id || null,
      employee_id: employee_id || null,
      student_id: student_id || null,
      createdById: adminId,
    };

    const newUser = await tx.user.create({ data: cleanData });

    await tx.radcheck.create({
      data: {
        username: username,
        attribute: 'Crypt-Password',
        op: ':=',
        value: hashedPassword,
      },
    });

    await tx.radusergroup.create({
      data: {
        username: username,
        groupname: profile_name,
        priority: 10,
      },
    });

    return { newUser };
  });
};

const getAllUsers = async (filters) => {
  const { searchTerm, organizationId, page = 1, pageSize = 10 } = filters;

  const whereClause = {};
  if (searchTerm) {
    whereClause.OR = [
      { username: { contains: searchTerm } },
      { full_name: { contains: searchTerm } },
    ];
  }
  if (organizationId) {
    whereClause.organizationId = parseInt(organizationId);
  }

  const skip = (page - 1) * pageSize;
  const take = parseInt(pageSize);

  const [users, totalUsers] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        full_name: true,
        organizationId: true,
        national_id: true,
        employee_id: true,
        student_id: true,
        organization: {
          select: {
            name: true,
            login_identifier_type: true,
          },
        },
        createdBy: {
          select: {
            username: true,
            fullName: true,
          }
        }
      },
      skip: skip,
      take: take,
      orderBy: {
        username: 'asc',
      },
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return {
    users,
    totalUsers,
    totalPages: Math.ceil(totalUsers / pageSize),
    currentPage: parseInt(page),
  };
};

const getUserByUsername = async (username) => {
  // ... (โค้ดส่วนนี้เหมือนเดิม ไม่มีการเปลี่ยนแปลง)
  const user = await prisma.user.findUnique({
    where: { username: username },
    include: {
      organization: true,
    },
  });

  if (!user) {
    throw new Error(`User with username '${username}' not found.`);
  }
  return user;
};

const deleteUserByUsername = async (username) => {
  // ... (โค้ดส่วนนี้เหมือนเดิม ไม่มีการเปลี่ยนแปลง)
  return prisma.$transaction(async (tx) => {
    await tx.user.deleteMany({
        where: { username: username },
    });
      
    const deletedFromRadcheck = await tx.radcheck.deleteMany({
      where: { username: username },
    });

    const deletedFromRadusergroup = await tx.radusergroup.deleteMany({
      where: { username: username },
    });

    if (deletedFromRadcheck.count === 0) {
      throw new Error(`User with username '${username}' not found.`);
    }

    return {
      deletedFromRadcheck,
      deletedFromRadusergroup
    };
  });
};

const updateUserByUsername = async (username, updateData) => {
  const { password, full_name, organizationId } = updateData;

  if (!password && !full_name && (organizationId === undefined || organizationId === null)) {
    throw new Error('No new data provided for update.');
  }

  return prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { username: username },
      // --- เพิ่ม: ดึงข้อมูล organization เดิมมาด้วย ---
      include: {
        organization: true,
      },
    });

    if (!existingUser) {
      throw new Error(`User with username '${username}' not found.`);
    }

    const updatedResults = {};
    const dataToUpdateInUserTable = {};

    if (full_name) {
      dataToUpdateInUserTable.full_name = full_name;
      updatedResults.full_name = 'updated';
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      dataToUpdateInUserTable.password = hashedPassword;
      await tx.radcheck.updateMany({
        where: { username: username, attribute: 'Crypt-Password' },
        data: { value: hashedPassword },
      });
      updatedResults.password = 'updated';
    }

    if (organizationId && existingUser.organizationId !== organizationId) {
      const newOrg = await tx.organization.findUnique({
        where: { id: organizationId },
        include: { radiusProfile: true },
      });

      if (!newOrg || !newOrg.radiusProfile) {
        throw new Error('Target organization or its associated profile not found.');
      }
      
      // --- START: เพิ่ม Logic ตรวจสอบ Type ---
      if (existingUser.organization.login_identifier_type !== newOrg.login_identifier_type) {
        throw new Error('Cannot move user to an organization with a different login identifier type.');
      }
      // --- END: สิ้นสุด Logic ตรวจสอบ Type ---

      await tx.radusergroup.updateMany({
        where: { username: username },
        data: { groupname: newOrg.radiusProfile.name },
      });
      
      dataToUpdateInUserTable.organizationId = organizationId;
      updatedResults.organization = 'updated';
    }

    if (Object.keys(dataToUpdateInUserTable).length > 0) {
      await tx.user.update({
        where: { username: username },
        data: dataToUpdateInUserTable,
      });
    }

    return updatedResults;
  });
};

const moveUsersToNewOrganization = async (userIds, targetOrganizationId) => {
    const targetOrgId = parseInt(targetOrganizationId);

    return prisma.$transaction(async (tx) => {
        if (!userIds || userIds.length === 0) {
            throw new Error('No users selected to move.');
        }

        const targetOrganization = await tx.organization.findUnique({
            where: { id: targetOrgId },
            include: { radiusProfile: true },
        });

        if (!targetOrganization || !targetOrganization.radiusProfile) {
            throw new Error('Target organization or its associated profile not found.');
        }

        const usersToMove = await tx.user.findMany({
            where: { id: { in: userIds } },
            include: { organization: true }, // ดึงข้อมูลองค์กรเดิม
        });
        
        // --- START: เพิ่ม Logic ตรวจสอบ Type ---
        for (const user of usersToMove) {
            if (user.organization.login_identifier_type !== targetOrganization.login_identifier_type) {
                throw new Error(`Cannot move user '${user.username}' as their organization type does not match the target organization type.`);
            }
        }
        // --- END: สิ้นสุด Logic ตรวจสอบ Type ---
        
        const usernamesToMove = new Set(usersToMove.map(u => u.username));

        const usersInTargetOrg = await tx.user.findMany({
            where: { organizationId: targetOrgId },
            select: { username: true },
        });
        const existingUsernames = new Set(usersInTargetOrg.map(u => u.username));

        const conflictingUsernames = [];
        for (const username of usernamesToMove) {
            if (existingUsernames.has(username)) {
                conflictingUsernames.push(username);
            }
        }

        if (conflictingUsernames.length > 0) {
            throw new Error(`Move failed due to duplicate usernames: ${conflictingUsernames.join(', ')}`);
        }
        
        const updatedUsersResult = await tx.user.updateMany({
            where: { id: { in: userIds } },
            data: { organizationId: targetOrgId },
        });

        await tx.radusergroup.updateMany({
            where: { username: { in: Array.from(usernamesToMove) } },
            data: { groupname: targetOrganization.radiusProfile.name },
        });

        return { movedCount: updatedUsersResult.count };
    });
};

const deleteUsersByUsernames = async (usernames) => {
  return prisma.$transaction(async (tx) => {
    // 1. ลบจากตาราง radcheck
    await tx.radcheck.deleteMany({
      where: { username: { in: usernames } },
    });

    // 2. ลบจากตาราง radusergroup
    await tx.radusergroup.deleteMany({
      where: { username: { in: usernames } },
    });
    
    // 3. ลบจากตาราง user หลัก
    const deletedUsersResult = await tx.user.deleteMany({
      where: { username: { in: usernames } },
    });

    // 4. คืนค่าจำนวนที่ลบได้
    return { deletedCount: deletedUsersResult.count };
  });
};


module.exports = {
  createUserAndSync,
  getAllUsers,
  deleteUserByUsername,
  updateUserByUsername,
  getUserByUsername,
  moveUsersToNewOrganization,
  deleteUsersByUsernames,
};