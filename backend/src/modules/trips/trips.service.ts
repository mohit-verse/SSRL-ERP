import { TripsRepository } from './trips.repository';
import { FinancialYearsRepository } from '../financial-years/financial-years.repository';
import { PartiesRepository } from '../parties/parties.repository';
import { OwnFleetRepository } from '../own-fleet/own-fleet.repository';
import { BusinessError, NotFoundError } from '../../utils/errors';
import { CustomerType, VehicleType, TripStatus, SequenceKey, Prisma } from '@prisma/client';
import { buildSearchCondition } from '../../utils/search';
import { prisma } from '../../prisma/client';
import { TripFinancialService } from './trip-financial.service';

export class TripsService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createTrip(data: any, userId: string) {
    const activeFy = await FinancialYearsRepository.findActive();
    if (!activeFy) throw new BusinessError('No active Financial Year found');

    const party = await PartiesRepository.findById(data.party_id);
    if (!party) throw new NotFoundError('Party not found');
    if (!party.is_active) throw new BusinessError('Cannot select an inactive Party');

    // Auto-detect vehicle
    let vehicleType: VehicleType = VehicleType.EXTERNAL;
    let ownerName = data.vehicle_owner_name;
    let ownerMobile = data.vehicle_owner_mobile;

    const ownVehicle = await OwnFleetRepository.findByVehicleNumber(data.vehicle_number);
    if (ownVehicle) {
      vehicleType = VehicleType.OWN_FLEET;
      ownerName = null;
      ownerMobile = null;
    } else {
      const extVehicle = await prisma.vehicleDirectory.findUnique({
        where: { vehicle_number: data.vehicle_number },
      });
      if (extVehicle) {
        ownerName = extVehicle.owner_name;
        ownerMobile = extVehicle.owner_mobile;
      } else {
        if (!ownerName || !ownerMobile) {
          throw new BusinessError(
            'Vehicle Owner Name and Mobile are required for new external vehicles',
          );
        }
        await prisma.vehicleDirectory.create({
          data: {
            vehicle_number: data.vehicle_number,
            owner_name: ownerName,
            owner_mobile: ownerMobile,
            is_active: true,
          },
        });
      }
    }

    // Number generation using a transaction for atomicity
    const nextNumberObj = await prisma.numberSequence.update({
      where: {
        financial_year_id_sequence_key: {
          financial_year_id: activeFy.id,
          sequence_key: SequenceKey.TRIP,
        },
      },
      data: { last_number: { increment: 1 } },
    });

    if (!nextNumberObj) {
      throw new BusinessError('Number Sequence for Trips not initialized');
    }
    const tripNumber = `${nextNumberObj.prefix}${String(nextNumberObj.last_number).padStart(4, '0')}`;

    const customerAdvance = data.customer_advance || 0;
    const freightRate = data.freight_rate || 0;
    const vehicleRate = data.vehicle_rate || 0;
    const ownerAdvance = data.owner_advance || 0;

    const financials = TripFinancialService.calculateAll({
      vehicleType,
      freightRate,
      customerAdvance,
      vehicleRate,
      ownerAdvance,
      currentExpensesTotal: 0,
    });

    return TripsRepository.create({
      trip_number: tripNumber,
      financial_year: { connect: { id: activeFy.id } },
      customer_type: party.party_type === 'MARKET' ? CustomerType.MARKET : CustomerType.COMPANY,
      vehicle_type: vehicleType,
      status: TripStatus.CREATED,
      loading_date: new Date(data.loading_date),
      party: { connect: { id: party.id } },
      party_name_snapshot: party.party_name,
      gst_number_snapshot: party.gst_number,
      from_city: data.from_city,
      to_city: data.to_city,
      vehicle_number: data.vehicle_number,
      driver_mobile: data.driver_mobile,
      vehicle_owner_name_snapshot: ownerName,
      vehicle_owner_mobile_snapshot: ownerMobile,
      weight: data.weight || null,
      freight_rate: freightRate,
      vehicle_rate: vehicleRate,
      lr_number: data.lr_number || null,
      customer_advance: customerAdvance,
      customer_balance: financials.customerBalance,
      owner_advance: vehicleType === VehicleType.EXTERNAL ? ownerAdvance : null,
      owner_balance: financials.ownerBalance,
      detention: null,
      deduction: null,
      revenue: financials.revenue,
      expense: financials.expense,
      profit: financials.profit,
      remarks: data.remarks || null,
      creator: { connect: { id: userId } },
    });
  }

  static async listTrips(query: string, skip: number, take: number) {
    const where: Prisma.TripWhereInput = { deleted_at: null };
    if (query) {
      Object.assign(
        where,
        buildSearchCondition(
          ['trip_number', 'from_city', 'to_city', 'vehicle_number', 'driver_mobile', 'lr_number'],
          query,
        ),
      );
    }

    const [data, total] = await Promise.all([
      TripsRepository.findAll({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: { party: true },
      }),
      TripsRepository.count(where),
    ]);

    return { data, total };
  }

  static async getTrip(id: string) {
    const trip = await TripsRepository.findById(id);
    if (!trip || trip.deleted_at) throw new NotFoundError('Trip not found');
    return trip;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateTrip(id: string, data: any, userId: string) {
    const trip = await TripsRepository.findById(id);
    if (!trip || trip.deleted_at) throw new NotFoundError('Trip not found');

    const updateData: Prisma.TripUpdateInput = {
      updater: { connect: { id: userId } },
    };

    if (data.loading_date) updateData.loading_date = new Date(data.loading_date);

    if (data.unloading_date !== undefined) {
      if (data.unloading_date) {
        updateData.unloading_date = new Date(data.unloading_date);
        if (trip.status === TripStatus.CREATED || trip.status === TripStatus.IN_PROGRESS) {
          updateData.status = TripStatus.DELIVERED;
        }
      } else {
        updateData.unloading_date = null;
      }
    }

    if (data.from_city !== undefined) updateData.from_city = data.from_city;
    if (data.to_city !== undefined) updateData.to_city = data.to_city;

    // Changing vehicle number logic
    if (data.vehicle_number && data.vehicle_number !== trip.vehicle_number) {
      updateData.vehicle_number = data.vehicle_number;
      updateData.driver_mobile = data.driver_mobile;

      const ownVehicle = await OwnFleetRepository.findByVehicleNumber(data.vehicle_number);
      if (ownVehicle) {
        updateData.vehicle_type = VehicleType.OWN_FLEET;
        updateData.vehicle_owner_name_snapshot = null;
        updateData.vehicle_owner_mobile_snapshot = null;
      } else {
        updateData.vehicle_type = VehicleType.EXTERNAL;
        let ownerName = data.vehicle_owner_name;
        let ownerMobile = data.vehicle_owner_mobile;

        const extVehicle = await prisma.vehicleDirectory.findUnique({
          where: { vehicle_number: data.vehicle_number },
        });
        if (extVehicle) {
          ownerName = extVehicle.owner_name;
          ownerMobile = extVehicle.owner_mobile;
        } else {
          if (!ownerName || !ownerMobile) {
            throw new BusinessError(
              'Vehicle Owner Name and Mobile are required for new external vehicles',
            );
          }
          await prisma.vehicleDirectory.create({
            data: {
              vehicle_number: data.vehicle_number,
              owner_name: ownerName,
              owner_mobile: ownerMobile,
              is_active: true,
            },
          });
        }
        updateData.vehicle_owner_name_snapshot = ownerName;
        updateData.vehicle_owner_mobile_snapshot = ownerMobile;
      }
    } else {
      if (data.driver_mobile !== undefined) updateData.driver_mobile = data.driver_mobile;

      // If updating owner details directly without changing vehicle number (and it's external)
      if (trip.vehicle_type === VehicleType.EXTERNAL && data.vehicle_owner_name) {
        updateData.vehicle_owner_name_snapshot = data.vehicle_owner_name;
      }
      if (trip.vehicle_type === VehicleType.EXTERNAL && data.vehicle_owner_mobile) {
        updateData.vehicle_owner_mobile_snapshot = data.vehicle_owner_mobile;
      }
    }

    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.lr_number !== undefined) updateData.lr_number = data.lr_number;
    if (data.remarks !== undefined) updateData.remarks = data.remarks;

    if (data.detention !== undefined) updateData.detention = data.detention;
    if (data.deduction !== undefined) updateData.deduction = data.deduction;

    // Recalculate Financials
    const freightRate =
      data.freight_rate !== undefined ? data.freight_rate : Number(trip.freight_rate);
    const customerAdvance =
      data.customer_advance !== undefined ? data.customer_advance : Number(trip.customer_advance);

    const currentVehicleType = (updateData.vehicle_type as VehicleType) || trip.vehicle_type;
    const vehicleRate =
      data.vehicle_rate !== undefined
        ? data.vehicle_rate
        : trip.vehicle_rate
          ? Number(trip.vehicle_rate)
          : 0;
    const ownerAdvance =
      data.owner_advance !== undefined
        ? data.owner_advance
        : trip.owner_advance
          ? Number(trip.owner_advance)
          : 0;

    const totalExpense = trip.expenses
      ? trip.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
      : 0;

    const financials = TripFinancialService.calculateAll({
      vehicleType: currentVehicleType,
      freightRate,
      customerAdvance,
      vehicleRate,
      ownerAdvance,
      currentExpensesTotal: totalExpense,
    });

    updateData.freight_rate = freightRate;
    updateData.customer_advance = customerAdvance;
    updateData.customer_balance = financials.customerBalance;

    if (currentVehicleType === VehicleType.EXTERNAL) {
      updateData.vehicle_rate = vehicleRate;
      updateData.owner_advance = ownerAdvance;
      updateData.owner_balance = financials.ownerBalance;
    } else {
      updateData.vehicle_rate = null;
      updateData.owner_advance = null;
      updateData.owner_balance = null;
    }

    updateData.revenue = financials.revenue;
    updateData.expense = financials.expense;
    updateData.profit = financials.profit;

    return TripsRepository.update(id, updateData);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async addExpense(id: string, data: any, userId: string) {
    const trip = await TripsRepository.findById(id);
    if (!trip || trip.deleted_at) throw new NotFoundError('Trip not found');

    if (trip.vehicle_type !== VehicleType.OWN_FLEET) {
      throw new BusinessError('Expenses can only be added to Own Fleet trips');
    }

    await TripsRepository.createExpense({
      trip: { connect: { id } },
      expense_type: data.expense_type,
      amount: data.amount,
      expense_date: new Date(data.expense_date),
      remarks: data.remarks,
      creator: { connect: { id: userId } },
    });

    // Recalculate expense & profit for trip
    const totalExpense =
      trip.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0) + data.amount;

    const financials = TripFinancialService.calculateAll({
      vehicleType: trip.vehicle_type,
      freightRate: Number(trip.freight_rate),
      customerAdvance: Number(trip.customer_advance),
      vehicleRate: Number(trip.vehicle_rate || 0),
      ownerAdvance: Number(trip.owner_advance || 0),
      currentExpensesTotal: totalExpense,
    });

    await TripsRepository.update(id, {
      expense: financials.expense,
      profit: financials.profit,
    });

    return { message: 'Expense added successfully' };
  }

  static async softDelete(id: string) {
    const trip = await TripsRepository.findById(id);
    if (!trip) throw new NotFoundError('Trip not found');
    return TripsRepository.softDelete(id);
  }

  static async restore(id: string) {
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundError('Trip not found');
    return TripsRepository.restore(id);
  }
}
