import prisma from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

const USER_ROLES = [
  "PATIENT",
  "DOCTOR",
  "RECEPTION_STAFF",
  "PHARMACY_STAFF",
  "LAB_STAFF",
  "ADMIN",
];

const DOCTOR_TYPES = ["SPECIALIST", "PHYSICIAN"];

const getTrimmedValue = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue || null;
};

const validateRole = (role) => {
  if (!USER_ROLES.includes(role)) {
    throw new ApiError(400, `role must be one of: ${USER_ROLES.join(", ")}`);
  }
};

const buildPatientProfileData = (profile = {}) => ({
  name: getTrimmedValue(profile.name),
  dob: profile.dob ? new Date(profile.dob) : null,
  email: getTrimmedValue(profile.email),
  bloodGroup: getTrimmedValue(profile.bloodGroup),
  phone: getTrimmedValue(profile.phone),
  address: getTrimmedValue(profile.address),
  qrCode: getTrimmedValue(profile.qrCode),
});

const buildDoctorProfileData = (profile = {}, currentDoctor = null) => {
  const doctorType = profile.doctorType ?? currentDoctor?.doctorType;

  if (!doctorType || !DOCTOR_TYPES.includes(doctorType)) {
    throw new ApiError(400, `doctorType must be one of: ${DOCTOR_TYPES.join(", ")}`);
  }

  return {
    name: getTrimmedValue(profile.name),
    doctorType,
    specialization: getTrimmedValue(profile.specialization),
    isAvailable:
      typeof profile.isAvailable === "boolean"
        ? profile.isAvailable
        : (currentDoctor?.isAvailable ?? false),
  };
};

const validateProfileData = (role, profile = {}, currentRoleData = null) => {
  if (role === "PATIENT") {
    const patientProfile = buildPatientProfileData(profile);

    if (patientProfile.dob && Number.isNaN(patientProfile.dob.getTime())) {
      throw new ApiError(400, "dob must be a valid date");
    }

    return patientProfile;
  }

  if (role === "DOCTOR") {
    return buildDoctorProfileData(profile, currentRoleData?.doctor ?? null);
  }

  return {};
};

const getUserSelect = {
  id: true,
  ldapId: true,
  role: true,
  isActive: true,
  createdAt: true,
  patient: {
    select: {
      id: true,
      name: true,
      qrCode: true,
      email: true,
      phone: true,
    },
  },
  doctor: {
    select: {
      id: true,
      name: true,
      doctorType: true,
      specialization: true,
      isAvailable: true,
    },
  },
  receptionStaff: {
    select: {
      id: true,
    },
  },
  pharmacyStaff: {
    select: {
      id: true,
    },
  },
  labStaff: {
    select: {
      id: true,
    },
  },
};

const getUserWithDependencies = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      patient: {
        include: {
          visits: { select: { id: true } },
          appointments: { select: { id: true } },
          externalDocuments: { select: { id: true } },
        },
      },
      doctor: {
        include: {
          visits: { select: { id: true } },
          appointments: { select: { id: true } },
          prescriptions: { select: { id: true } },
          labRequests: { select: { id: true } },
          attendance: { select: { id: true } },
        },
      },
      labStaff: {
        include: {
          labReports: { select: { id: true } },
        },
      },
      receptionStaff: true,
      pharmacyStaff: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const hasBlockingDependenciesForRoleChange = (user) => {
  if (
    user.patient &&
    (user.patient.visits.length ||
      user.patient.appointments.length ||
      user.patient.externalDocuments.length)
  ) {
    return "Cannot change role for a patient with existing visits, appointments, or documents";
  }

  if (
    user.doctor &&
    (user.doctor.visits.length ||
      user.doctor.appointments.length ||
      user.doctor.prescriptions.length ||
      user.doctor.labRequests.length ||
      user.doctor.attendance.length)
  ) {
    return "Cannot change role for a doctor with existing clinical or attendance records";
  }

  if (user.labStaff && user.labStaff.labReports.length) {
    return "Cannot change role for lab staff with uploaded reports";
  }

  return null;
};

const createRoleProfile = async (tx, userId, role, profileData) => {
  if (role === "PATIENT") {
    await tx.patient.create({
      data: {
        userId,
        ...profileData,
      },
    });
    return;
  }

  if (role === "DOCTOR") {
    await tx.doctor.create({
      data: {
        userId,
        ...profileData,
      },
    });
    return;
  }

  if (role === "RECEPTION_STAFF") {
    await tx.receptionStaff.create({ data: { userId } });
    return;
  }

  if (role === "PHARMACY_STAFF") {
    await tx.pharmacyStaff.create({ data: { userId } });
    return;
  }

  if (role === "LAB_STAFF") {
    await tx.labStaff.create({ data: { userId } });
  }
};

const updateExistingProfile = async (tx, userId, role, profileData) => {
  if (role === "PATIENT") {
    await tx.patient.update({
      where: { userId },
      data: profileData,
    });
    return;
  }

  if (role === "DOCTOR") {
    await tx.doctor.update({
      where: { userId },
      data: profileData,
    });
  }
};

const deleteOldRoleProfile = async (tx, user) => {
  if (user.patient) {
    await tx.patient.delete({ where: { userId: user.id } });
    return;
  }

  if (user.doctor) {
    await tx.doctor.delete({ where: { userId: user.id } });
    return;
  }

  if (user.receptionStaff) {
    await tx.receptionStaff.delete({ where: { userId: user.id } });
    return;
  }

  if (user.pharmacyStaff) {
    await tx.pharmacyStaff.delete({ where: { userId: user.id } });
    return;
  }

  if (user.labStaff) {
    await tx.labStaff.delete({ where: { userId: user.id } });
  }
};

const getFormattedUser = async (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: getUserSelect,
  });

export const createManagedUser = async ({ ldapId, role, isActive = true, profile = {} }) => {
  const normalizedLdapId = getTrimmedValue(ldapId);

  if (!normalizedLdapId) {
    throw new ApiError(400, "ldapId is required");
  }

  validateRole(role);

  const existingUser = await prisma.user.findUnique({
    where: { ldapId: normalizedLdapId },
    select: { id: true },
  });

  if (existingUser) {
    throw new ApiError(409, "A user with this ldapId already exists");
  }

  const profileData = validateProfileData(role, profile);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        ldapId: normalizedLdapId,
        role,
        isActive: Boolean(isActive),
      },
    });

    await createRoleProfile(tx, createdUser.id, role, profileData);

    return createdUser;
  });

  return getFormattedUser(user.id);
};

export const listManagedUsers = async ({ role, isActive, ldapId }) => {
  if (role) {
    validateRole(role);
  }

  const filters = {};

  if (role) {
    filters.role = role;
  }

  if (typeof isActive === "boolean") {
    filters.isActive = isActive;
  }

  const normalizedSearch = getTrimmedValue(ldapId);
  if (normalizedSearch) {
    filters.ldapId = { contains: normalizedSearch };
  }

  return prisma.user.findMany({
    where: filters,
    select: getUserSelect,
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });
};

export const updateManagedUser = async (userId, { role, isActive, profile = {} }) => {
  const user = await getUserWithDependencies(userId);

  const nextRole = role ?? user.role;
  validateRole(nextRole);

  const roleChanged = nextRole !== user.role;
  const shouldUpdateActiveFlag = typeof isActive === "boolean";
  const profileData = validateProfileData(nextRole, profile, user);

  if (!roleChanged && !shouldUpdateActiveFlag && Object.keys(profile).length === 0) {
    throw new ApiError(400, "Provide at least one field to update");
  }

  if (roleChanged) {
    const blockingReason = hasBlockingDependenciesForRoleChange(user);
    if (blockingReason) {
      throw new ApiError(400, blockingReason);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        role: nextRole,
        ...(shouldUpdateActiveFlag ? { isActive } : {}),
      },
    });

    if (roleChanged) {
      await deleteOldRoleProfile(tx, user);
      await createRoleProfile(tx, userId, nextRole, profileData);
      return;
    }

    if (Object.keys(profile).length > 0 && (nextRole === "PATIENT" || nextRole === "DOCTOR")) {
      await updateExistingProfile(tx, userId, nextRole, profileData);
    }
  });

  return getFormattedUser(userId);
};
