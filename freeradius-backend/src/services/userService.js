// freeradius-backend/src/services/userService.js
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');

const createUserAndSync = async (userData, adminId) => {
  const {
    organizationId,
    password,
    full_name,
    national_id,
    employee_id,
    student_id,
    username: manualUsername,
    email,
    phoneNumber
  } = userData;

  if (!organizationId) throw new Error('Organization ID is required.');

  const organization = await prisma.organization.findUnique({
    where: { id: parseInt(organizationId, 10) },
    include: { radiusProfile: true },
  });

  if (!organization) throw new Error('Organization not found');
  if (!organization.radiusProfile) throw new Error('This organization does not have a Radius Profile assigned.');

  if (!password) throw new Error('Password is required.');
  if (!full_name) throw new Error('Full Name is required.');

  let username;
  let dataForDb = { national_id, employee_id, student_id };

  switch (organization.login_identifier_type) {
    case 'manual':
      if (!manualUsername) throw new Error('Username is required for this organization type.');
      if (employee_id) throw new Error('Employee ID must be empty for manual type.');
      if (student_id) throw new Error('Student ID must be empty for manual type.');
      username = manualUsername;
      dataForDb.employee_id = null;
      dataForDb.student_id = null;
      break;
    case 'national_id':
      if (!national_id) throw new Error('National ID is required for this organization type.');
      if (manualUsername || employee_id || student_id) throw new Error('Username, Employee ID, and Student ID must be empty for national_id type.');
      username = national_id;
      break;
    case 'employee_id':
      if (!employee_id) throw new Error('Employee ID is required for this organization type.');
      if (manualUsername) throw new Error('Username must be empty for employee_id type.');
      username = employee_id;
      break;
    case 'student_id':
      if (!student_id) throw new Error('Student ID is required for this organization type.');
      if (manualUsername || employee_id) throw new Error('Username and Employee ID must be empty for student_id type.');
      username = student_id;
      break;
    default:
      throw new Error('Invalid organization login identifier type.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const profile_name = organization.radiusProfile.name;

  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        organizationId: parseInt(organizationId, 10),
        username,
        password: hashedPassword,
        full_name,
        national_id: dataForDb.national_id || null,
        employee_id: dataForDb.employee_id || null,
        student_id: dataForDb.student_id || null,
        email: email || null,
        phoneNumber: phoneNumber || null,
        createdById: adminId,
      },
    });

    await tx.radcheck.create({
      data: { username, attribute: 'Crypt-Password', op: ':=', value: hashedPassword },
    });
    await tx.radusergroup.create({
      data: { username, groupname: profile_name, priority: 10 },
    });

    return { newUser };
  });
};

const importUsersFromCSV = (filePath) => {
  return new Promise(async (resolve, reject) => {
    const usersToCreate = [];
    const errors = [];
    let rowIndex = 1;

    try {
      const allOrgs = await prisma.organization.findMany({ include: { radiusProfile: true } });
      const allUsers = await prisma.user.findMany({ select: { username: true, email: true } });
      const orgMap = new Map(allOrgs.map(org => [org.name.toLowerCase(), org]));
      const existingUsernames = new Set(allUsers.map(u => u.username));
      const existingEmails = new Set(allUsers.filter(u => u.email).map(u => u.email));
      const usernamesInFile = new Set();
      const emailsInFile = new Set();

      fs.createReadStream(filePath, { encoding: 'utf8' })
        .pipe(csv({ mapHeaders: ({ header }) => header.trim(), bom: true }))
        .on('data', (row) => {
          rowIndex++;
          const cleanedRow = Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value ? value.trim() : '']));
          const { organizationName, fullName, password, username: manualUsername, national_id, employee_id, student_id, email } = cleanedRow;

          if (!organizationName || !fullName || !password) {
            return errors.push({ row: rowIndex, message: `Missing required data (organizationName, fullName, password)` });
          }
          const org = orgMap.get(organizationName.toLowerCase());
          if (!org) return errors.push({ row: rowIndex, message: `Organization '${organizationName}' not found.` });
          if (!org.radiusProfile) return errors.push({ row: rowIndex, message: `Organization '${organizationName}' has no assigned Radius Profile.`});

          if (email && (existingEmails.has(email) || emailsInFile.has(email))) {
            return errors.push({ row: rowIndex, message: `Email '${email}' already exists.` });
          }
          if(email) emailsInFile.add(email);

          let finalUsername = '';
          // --- START: อัปเดตเงื่อนไขการตรวจสอบข้อมูล CSV ---
          switch (org.login_identifier_type) {
            case 'manual':
              if (!manualUsername) return errors.push({ row: rowIndex, message: `Username is required for manual type.` });
              if (employee_id) return errors.push({ row: rowIndex, message: `Employee ID must be empty for manual type.` });
              if (student_id) return errors.push({ row: rowIndex, message: `Student ID must be empty for manual type.` });
              finalUsername = manualUsername;
              break;
            case 'national_id':
              if (!national_id) return errors.push({ row: rowIndex, message: `National ID is required for national_id type.` });
              if (manualUsername || employee_id || student_id) return errors.push({ row: rowIndex, message: `Username, Employee ID, and Student ID must be empty for national_id type.` });
              finalUsername = national_id;
              break;
            case 'employee_id':
              if (!employee_id) return errors.push({ row: rowIndex, message: `Employee ID is required for employee_id type.` });
              if (manualUsername) return errors.push({ row: rowIndex, message: `Username must be empty for employee_id type.` });
              finalUsername = employee_id;
              break;
            case 'student_id':
              if (!student_id) return errors.push({ row: rowIndex, message: `Student ID is required for student_id type.` });
              if (manualUsername || employee_id) return errors.push({ row: rowIndex, message: `Username and Employee ID must be empty for student_id type.` });
              finalUsername = student_id;
              break;
            default:
              return errors.push({ row: rowIndex, message: `Unsupported login type for organization '${organizationName}'.` });
          }

          if (existingUsernames.has(finalUsername) || usernamesInFile.has(finalUsername)) {
            return errors.push({ row: rowIndex, message: `Identifier (username/ID) '${finalUsername}' already exists.` });
          }
          usernamesInFile.add(finalUsername);
          usersToCreate.push({ ...cleanedRow, organizationId: org.id, username: finalUsername, profileName: org.radiusProfile.name });
        })
        .on('end', async () => {
          fs.unlinkSync(filePath);
          if (errors.length > 0) return reject({ errors });

          try {
            await prisma.$transaction(async (tx) => {
              for (const userData of usersToCreate) {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                await tx.user.create({
                  data: {
                    organizationId: userData.organizationId,
                    username: userData.username,
                    password: hashedPassword,
                    full_name: userData.fullName,
                    national_id: userData.national_id || null,
                    employee_id: userData.employee_id || null,
                    student_id: userData.student_id || null,
                    email: userData.email || null,
                    phoneNumber: userData.phoneNumber || null,
                  },
                });
                await tx.radcheck.create({
                  data: { username: userData.username, attribute: 'Crypt-Password', op: ':=', value: hashedPassword },
                });
                await tx.radusergroup.create({
                  data: { username: userData.username, groupname: userData.profileName, priority: 10 },
                });
              }
            });
            resolve({ successCount: usersToCreate.length });
          } catch (transactionError) {
            reject({ message: 'A database error occurred during import. No users were created.' });
          }
        })
        .on('error', (error) => {
          fs.unlinkSync(filePath);
          reject({ message: 'An error occurred while parsing the CSV file.' });
        });

    } catch (error) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject({ message: 'An unexpected error occurred while setting up the import process.' });
    }
  });
};


const getAllUsers = async (filters) => {
  // 1. เพิ่ม status เข้าไปใน destructuring
  const { searchTerm, organizationId, page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'desc', status } = filters;

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

  // --- START: เพิ่มเงื่อนไขการกรอง status ---
  // 2. เพิ่มเงื่อนไข: ถ้า status ถูกส่งมาและไม่ใช่ 'all' ให้เพิ่มเข้าไปใน whereClause
  if (status && status !== 'all') {
    whereClause.status = status;
  }
  const skip = (page - 1) * pageSize;
  const take = parseInt(pageSize);
  const orderBy = {};
  if (['username', 'full_name', 'createdAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
  } else {
      orderBy['createdAt'] = 'desc';
  }
  const [users, totalUsers] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        full_name: true,
        status: true,
        organizationId: true,
        national_id: true,
        employee_id: true,
        student_id: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        organization: {
          select: { name: true, login_identifier_type: true },
        },
        createdBy: {
          select: { username: true, fullName: true }
        }
      },
      skip: skip,
      take: take,
      orderBy: orderBy,
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
  const { password, full_name, organizationId, email, phoneNumber } = updateData;
  if (!password && !full_name && !email && !phoneNumber && (organizationId === undefined || organizationId === null)) {
    throw new Error('No new data provided for update.');
  }
  return prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { username: username },
      include: {
        organization: true,
      },
    });
    if (!existingUser) {
      throw new Error(`User with username '${username}' not found.`);
    }
    const dataToUpdateInUserTable = {};
    if (full_name) {
      dataToUpdateInUserTable.full_name = full_name;
    }
    if (email !== undefined) {
        dataToUpdateInUserTable.email = email;
    }
    if (phoneNumber !== undefined) {
        dataToUpdateInUserTable.phoneNumber = phoneNumber;
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      dataToUpdateInUserTable.password = hashedPassword;
      await tx.radcheck.updateMany({
        where: { username: username, attribute: 'Crypt-Password' },
        data: { value: hashedPassword },
      });
    }
    if (organizationId && existingUser.organizationId !== organizationId) {
      const newOrg = await tx.organization.findUnique({
        where: { id: organizationId },
        include: { radiusProfile: true },
      });
      if (!newOrg || !newOrg.radiusProfile) {
        throw new Error('Target organization or its associated profile not found.');
      }
      if (existingUser.organization.login_identifier_type !== newOrg.login_identifier_type) {
        throw new Error('Cannot move user to an organization with a different login identifier type.');
      }
      await tx.radusergroup.updateMany({
        where: { username: username },
        data: { groupname: newOrg.radiusProfile.name },
      });
      dataToUpdateInUserTable.organizationId = organizationId;
    }
    if (Object.keys(dataToUpdateInUserTable).length > 0) {
      await tx.user.update({
        where: { username: username },
        data: dataToUpdateInUserTable,
      });
    }
    return { message: 'User updated' };
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
            include: { organization: true },
        });
        for (const user of usersToMove) {
            if (user.organization.login_identifier_type !== targetOrganization.login_identifier_type) {
                throw new Error(`Cannot move user '${user.username}' as their organization type does not match the target organization type.`);
            }
        }
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
    await tx.radcheck.deleteMany({
      where: { username: { in: usernames } },
    });
    await tx.radusergroup.deleteMany({
      where: { username: { in: usernames } },
    });
    const deletedUsersResult = await tx.user.deleteMany({
      where: { username: { in: usernames } },
    });
    return { deletedCount: deletedUsersResult.count };
  });
};
const toggleUserStatusByUsername = async (username) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { username },
    });
    if (!user) {
      throw new Error(`User with username '${username}' not found.`);
    }
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    await tx.user.update({
      where: { username },
      data: { status: newStatus },
    });
    if (newStatus === 'disabled') {
      await tx.radcheck.upsert({
        where: {
          username_attribute: {
             username: username,
             attribute: 'Auth-Type'
          }
        },
        update: { value: 'Reject' },
        create: {
          username: username,
          attribute: 'Auth-Type',
          op: ':=',
          value: 'Reject',
        },
      });
    } else {
      await tx.radcheck.deleteMany({
        where: {
          username: username,
          attribute: 'Auth-Type',
        },
      });
    }
    return { newStatus };
  });
};

// --- START: ADDED FUNCTION ---
const approveUsersByUsernames = async (usernames) => {
    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
        throw new Error("Usernames array is required.");
    }

    return prisma.$transaction(async (tx) => {
        // 1. Update user status to 'active'
        const updatedUsersResult = await tx.user.updateMany({
            where: {
                username: { in: usernames },
                status: 'registered', // Only approve users that are in 'registered' state
            },
            data: { status: 'active' },
        });

        // 2. Remove the 'Auth-Type := Reject' rule from radcheck to allow login
        await tx.radcheck.deleteMany({
            where: {
                username: { in: usernames },
                attribute: 'Auth-Type',
                value: 'Reject',
            },
        });

        return { approvedCount: updatedUsersResult.count };
    });
};
// --- END: ADDED FUNCTION ---

module.exports = {
  createUserAndSync,
  getAllUsers,
  getUserByUsername,
  deleteUserByUsername,
  updateUserByUsername,
  moveUsersToNewOrganization,
  deleteUsersByUsernames,
  toggleUserStatusByUsername,
  importUsersFromCSV,
  approveUsersByUsernames, // <-- Export the new function
};