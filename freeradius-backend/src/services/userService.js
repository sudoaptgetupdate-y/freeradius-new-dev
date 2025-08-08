// freeradius-backend/src/services/userService.js
const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');

// --- START: แก้ไขฟังก์ชันนี้ ---
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

  // เพิ่มการตรวจสอบข้อมูลที่ขัดแย้งกัน เหมือนกับใน CSV Import
  switch (login_identifier_type) {
    case 'manual':
      if (!manualUsername) throw new Error('Username is required for this organization type.');
      if (national_id || employee_id || student_id) throw new Error('National ID, Employee ID, and Student ID must be empty for manual type.');
      username = manualUsername;
      break;
    case 'national_id':
      if (!national_id) throw new Error('National ID is required for this organization type.');
      if (manualUsername || employee_id || student_id) throw new Error('Username, Employee ID, and Student ID must be empty for national_id type.');
      username = national_id;
      break;
    case 'employee_id':
      if (!employee_id) throw new Error('Employee ID is required for this organization type.');
      if (manualUsername || national_id || student_id) throw new Error('Username, National ID, and Student ID must be empty for employee_id type.');
      username = employee_id;
      break;
    case 'student_id':
      if (!student_id) throw new Error('Student ID is required for this organization type.');
      if (manualUsername || national_id || employee_id) throw new Error('Username, National ID, and Employee ID must be empty for student_id type.');
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
      email: email || null,
      phoneNumber: phoneNumber || null,
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
// --- END: สิ้นสุดการแก้ไข ---

// --- (ฟังก์ชันอื่นๆ ที่เหลือให้คงไว้เหมือนเดิม) ---

const getAllUsers = async (filters) => {
  const { searchTerm, organizationId, page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

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

  const orderBy = {};
  // Allow sorting only by specific, safe fields
  if (['username', 'full_name', 'createdAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
  } else {
      orderBy['createdAt'] = 'desc'; // Default sort
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
        createdAt: true, // <-- เพิ่ม field นี้เข้ามาใน select
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
      orderBy: orderBy, // <-- ใช้ object การเรียงลำดับที่สร้างขึ้น
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

const importUsersFromCSV = (filePath) => {
  return new Promise(async (resolve, reject) => {
    const usersToCreate = [];
    const errors = [];
    let rowIndex = 1;

    try {
      const allOrgs = await prisma.organization.findMany({ include: { radiusProfile: true } });
      const allUsers = await prisma.user.findMany({
        select: { username: true, email: true },
      });

      const orgMap = new Map(allOrgs.map(org => [org.name.toLowerCase(), org]));
      const existingUsernames = new Set(allUsers.map(u => u.username));
      const existingEmails = new Set(allUsers.filter(u => u.email).map(u => u.email));
      const usernamesInFile = new Set();
      const emailsInFile = new Set();
      
      fs.createReadStream(filePath, { encoding: 'utf8' })
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim(),
          bom: true
        }))
        .on('data', (row) => {
          rowIndex++;
          const cleanedRow = Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value ? value.trim() : '']));
          
          const { organizationName, fullName, password, username, national_id, employee_id, student_id, email, phoneNumber } = cleanedRow;

          if (!organizationName || !fullName || !password) {
            return errors.push({ row: rowIndex, message: `Missing required data (organizationName, fullName, password)` });
          }
          const org = orgMap.get(organizationName.toLowerCase());
          if (!org) {
            return errors.push({ row: rowIndex, message: `Organization '${organizationName}' not found.` });
          }
          if (!org.radiusProfile) {
            return errors.push({ row: rowIndex, message: `Organization '${organizationName}' does not have a Radius Profile assigned.`});
          }
          if (email && (existingEmails.has(email) || emailsInFile.has(email))) {
            return errors.push({ row: rowIndex, message: `Email '${email}' already exists.` });
          }
          if(email) emailsInFile.add(email);
          
          let finalUsername = '';
          switch (org.login_identifier_type) {
            case 'manual':
              if (!username) return errors.push({ row: rowIndex, message: `Username is required for organization '${organizationName}'.` });
              if (national_id || employee_id || student_id) return errors.push({ row: rowIndex, message: `National ID, Employee ID, and Student ID must be empty for manual type.` });
              finalUsername = username; 
              break;
            case 'national_id':
              if (!national_id) return errors.push({ row: rowIndex, message: `National ID is required for organization '${organizationName}'.` });
              if (username || employee_id || student_id) return errors.push({ row: rowIndex, message: `Username, Employee ID, and Student ID must be empty for national_id type.` });
              finalUsername = national_id; 
              break;
            case 'employee_id':
              if (!employee_id) return errors.push({ row: rowIndex, message: `Employee ID is required for organization '${organizationName}'.` });
              if (username || national_id || student_id) return errors.push({ row: rowIndex, message: `Username, National ID, and Student ID must be empty for employee_id type.` });
              finalUsername = employee_id; 
              break;
            case 'student_id':
              if (!student_id) return errors.push({ row: rowIndex, message: `Student ID is required for organization '${organizationName}'.` });
              if (username || national_id || employee_id) return errors.push({ row: rowIndex, message: `Username, National ID, and Employee ID must be empty for student_id type.` });
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
          if (errors.length > 0) {
            return reject({ errors });
          }
          
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
                  data: {
                    username: userData.username,
                    attribute: 'Crypt-Password',
                    op: ':=',
                    value: hashedPassword,
                  },
                });
                await tx.radusergroup.create({
                  data: {
                    username: userData.username,
                    groupname: userData.profileName,
                    priority: 10,
                  },
                });
              }
            });
            resolve({ successCount: usersToCreate.length });
          } catch (transactionError) {
            console.error("Transaction Error:", transactionError);
            reject({ message: 'A database error occurred during import. No users were created.' });
          }
        })
        .on('error', (error) => {
          fs.unlinkSync(filePath);
          console.error("CSV Stream Error:", error);
          reject({ message: 'An error occurred while parsing the CSV file.' });
        });

    } catch (error) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      console.error("CSV Import Setup Error:", error);
      reject({ message: 'An unexpected error occurred while setting up the import process.' });
    }
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
  toggleUserStatusByUsername,
  importUsersFromCSV,
};