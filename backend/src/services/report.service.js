import prisma from "../db/index.js";

const getThirtyDaysAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date;
};

export const getUsageReport = async () => {
  const thirtyDaysAgo = getThirtyDaysAgo();

  const [
    totalUsers,
    activeUsers,
    patients,
    doctors,
    visits,
    appointments,
    prescriptions,
    labRequests,
    bills,
    usersByRole,
    recentVisits,
    recentAppointments,
    recentBills,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.patient.count(),
    prisma.doctor.count(),
    prisma.visit.count(),
    prisma.appointment.count(),
    prisma.prescription.count(),
    prisma.labRequest.count(),
    prisma.bill.count(),
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.visit.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.appointment.count({
      where: { appointmentTime: { gte: thirtyDaysAgo } },
    }),
    prisma.bill.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  return {
    generatedAt: new Date(),
    totals: {
      users: totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      patients,
      doctors,
      visits,
      appointments,
      prescriptions,
      labRequests,
      bills,
    },
    usersByRole: usersByRole.map(({ role, _count }) => ({
      role,
      count: _count._all,
    })),
    last30Days: {
      visits: recentVisits,
      appointments: recentAppointments,
      bills: recentBills,
    },
  };
};

export const getAttendanceSummaryReport = async () => {
  const [summary, openCheckIns, groupedAttendance] = await Promise.all([
    prisma.doctorAttendance.aggregate({
      _count: { _all: true },
      _avg: { totalHours: true },
      _sum: { totalHours: true },
    }),
    prisma.doctorAttendance.count({ where: { checkOut: null } }),
    prisma.doctorAttendance.groupBy({
      by: ["doctorId"],
      _count: { _all: true },
      _avg: { totalHours: true },
      _sum: { totalHours: true },
      orderBy: {
        doctorId: "asc",
      },
    }),
  ]);

  const doctorIds = groupedAttendance.map((entry) => entry.doctorId);
  const doctors = doctorIds.length
    ? await prisma.doctor.findMany({
        where: { id: { in: doctorIds } },
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      })
    : [];

  const doctorMap = new Map(doctors.map((doctor) => [doctor.id, doctor]));

  return {
    generatedAt: new Date(),
    totals: {
      attendanceRecords: summary._count._all,
      openCheckIns,
      totalHours: summary._sum.totalHours ?? 0,
      averageHours: summary._avg.totalHours ?? 0,
    },
    byDoctor: groupedAttendance.map((entry) => ({
      doctorId: entry.doctorId,
      doctorName: doctorMap.get(entry.doctorId)?.name ?? null,
      specialization: doctorMap.get(entry.doctorId)?.specialization ?? null,
      attendanceRecords: entry._count._all,
      totalHours: entry._sum.totalHours ?? 0,
      averageHours: entry._avg.totalHours ?? 0,
    })),
  };
};
