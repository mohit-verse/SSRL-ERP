import { prisma } from '../../prisma/client';
import { Prisma, TripStatus, BillStatus } from '@prisma/client';

export class ReportingEngine {
  // ---------------------------------------------------------------------------
  // KPI Calculations
  // ---------------------------------------------------------------------------

  static async getMonthlyRevenue(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const result = await prisma.trip.aggregate({
      _sum: { revenue: true },
      where: { loading_date: { gte: start, lte: end }, deleted_at: null },
    });
    return Number(result._sum.revenue || 0);
  }

  static async getMonthlyExpense(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const result = await prisma.trip.aggregate({
      _sum: { expense: true },
      where: { loading_date: { gte: start, lte: end }, deleted_at: null },
    });
    return Number(result._sum.expense || 0);
  }

  static async getMonthlyProfit(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const result = await prisma.trip.aggregate({
      _sum: { profit: true },
      where: { loading_date: { gte: start, lte: end }, deleted_at: null },
    });
    return Number(result._sum.profit || 0);
  }

  static async getTotalOutstanding() {
    const result = await prisma.trip.aggregate({
      _sum: { customer_balance: true },
      where: { customer_balance: { gt: 0 }, deleted_at: null },
    });
    return Number(result._sum.customer_balance || 0);
  }

  // ---------------------------------------------------------------------------
  // Dashboard Metrics
  // ---------------------------------------------------------------------------

  static async getTodaysTrips() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return prisma.trip.findMany({
      where: { loading_date: { gte: start, lte: end }, deleted_at: null },
      include: { party: true },
    });
  }

  static async getPendingPOD() {
    return prisma.trip.findMany({
      where: {
        status: { in: [TripStatus.CREATED, TripStatus.IN_PROGRESS, TripStatus.DELIVERED] },
        pod_received_date: null,
        deleted_at: null,
      },
      include: { party: true },
      orderBy: { loading_date: 'asc' },
    });
  }

  static async getBillsPendingSubmission() {
    return prisma.bill.findMany({
      where: { status: BillStatus.GENERATED },
      include: { party: true },
      orderBy: { bill_date: 'asc' },
    });
  }

  static async getOutstandingPayments() {
    return prisma.trip.findMany({
      where: { customer_balance: { gt: 0 }, deleted_at: null },
      include: { party: true },
      orderBy: { loading_date: 'asc' },
    });
  }

  static async getVehicleDocumentAlerts() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return prisma.vehicleDocument.findMany({
      where: {
        expiry_date: { lte: nextMonth },
      },
      include: {
        own_vehicle: true,
      },
      orderBy: { expiry_date: 'asc' },
    });
  }

  static async getRecentActivity(limit = 10) {
    return prisma.activityLog.findMany({
      orderBy: { created_at: 'desc' },
      take: limit,
      include: { user: true },
    });
  }

  // ---------------------------------------------------------------------------
  // Reports
  // ---------------------------------------------------------------------------

  static async getMonthlyTripRegister(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    return prisma.trip.findMany({
      where: { loading_date: { gte: start, lte: end }, deleted_at: null },
      include: { party: true },
      orderBy: { loading_date: 'asc' },
    });
  }

  static async getPartyLedger(partyId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.TripWhereInput = { party_id: partyId, deleted_at: null };
    if (startDate && endDate) {
      where.loading_date = { gte: startDate, lte: endDate };
    }

    return prisma.trip.findMany({
      where,
      orderBy: { loading_date: 'asc' },
    });
  }

  static async getVehicleOwnerLedger(ownerMobile: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.TripWhereInput = {
      vehicle_owner_mobile_snapshot: ownerMobile,
      deleted_at: null,
    };
    if (startDate && endDate) {
      where.loading_date = { gte: startDate, lte: endDate };
    }

    return prisma.trip.findMany({
      where,
      orderBy: { loading_date: 'asc' },
    });
  }

  static async getOutstandingReport() {
    return prisma.trip.findMany({
      where: { customer_balance: { gt: 0 }, deleted_at: null },
      include: { party: true },
      orderBy: { loading_date: 'asc' },
    });
  }

  static async getPendingPODReport() {
    return this.getPendingPOD();
  }

  static async getFinancialSummary(year: number, month: number) {
    const revenue = await this.getMonthlyRevenue(year, month);
    const expense = await this.getMonthlyExpense(year, month);
    const profit = await this.getMonthlyProfit(year, month);
    const outstanding = await this.getTotalOutstanding();

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      revenue,
      expense,
      profit,
      outstanding,
    };
  }

  static async getProfitSummary(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    return prisma.trip.findMany({
      where: { loading_date: { gte: start, lte: end }, deleted_at: null },
      select: {
        trip_number: true,
        loading_date: true,
        revenue: true,
        expense: true,
        profit: true,
      },
      orderBy: { loading_date: 'asc' },
    });
  }
}
