import { TripStatus } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { BusinessError } from '../../utils/errors';

export class TripBillingEligibilityService {
  static async getEligibleTrips(partyId: string) {
    const trips = await prisma.trip.findMany({
      where: {
        party_id: partyId,
        deleted_at: null,
        bill_id: null,
        status: TripStatus.POD_RECEIVED,
        loading_date: { not: undefined },
        unloading_date: { not: null },
        trip_number: { not: '' },
        vehicle_number: { not: '' },
        freight_rate: { gt: 0 },
      },
      include: {
        party: true,
      },
    });

    // Post filter for party active, since we included it.
    return trips.filter((trip) => {
      const party = trip.party;
      return party && party.is_active;
    });
  }

  static async validateTripsForBilling(tripIds: string[], partyId: string) {
    const trips = await prisma.trip.findMany({
      where: { id: { in: tripIds } },
      include: { party: true },
    });

    if (trips.length !== tripIds.length) {
      throw new BusinessError('One or more selected trips were not found');
    }

    for (const trip of trips) {
      const party = trip.party;

      if (trip.deleted_at !== null)
        throw new BusinessError(`Trip ${trip.trip_number} is not active`);
      if (trip.party_id !== partyId)
        throw new BusinessError(`Trip ${trip.trip_number} does not belong to the selected Party`);
      if (!party || !party.is_active)
        throw new BusinessError(`Party for Trip ${trip.trip_number} is not active`);
      if (trip.bill_id !== null)
        throw new BusinessError(`Trip ${trip.trip_number} is already billed`);
      if (!trip.pod_received_date && trip.status !== TripStatus.POD_RECEIVED)
        throw new BusinessError(`Trip ${trip.trip_number} POD not received`);
      if (!trip.loading_date)
        throw new BusinessError(`Trip ${trip.trip_number} missing loading date`);
      if (!trip.unloading_date)
        throw new BusinessError(`Trip ${trip.trip_number} missing unloading date`);
      if (!trip.trip_number)
        throw new BusinessError(`Trip ${trip.trip_number} missing trip number`);
      if (!trip.vehicle_number)
        throw new BusinessError(`Trip ${trip.trip_number} missing vehicle number`);
      if (Number(trip.freight_rate) <= 0)
        throw new BusinessError(`Trip ${trip.trip_number} freight rate must be greater than 0`);
    }

    return trips;
  }
}
