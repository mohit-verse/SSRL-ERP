import { PartiesRepository } from './parties.repository';
import { BusinessError, NotFoundError } from '../../utils/errors';
import { PartyType, Prisma } from '@prisma/client';
import { buildSearchCondition } from '../../utils/search';

export class PartiesService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createParty(data: any) {
    if (data.gst_number) {
      const existing = await PartiesRepository.findByGst(data.gst_number);
      if (existing) throw new BusinessError('GST Number already exists');
    }

    return PartiesRepository.create({
      party_name: data.party_name,
      party_type: data.party_type,
      gst_number: data.gst_number || null,
      contact_person: data.contact_person,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state,
      billing_type: data.party_type === PartyType.COMPANY ? data.billing_type : null,
      payment_type: data.party_type === PartyType.COMPANY ? data.payment_type : null,
      is_active: true,
    });
  }

  static async listParties(query: string, skip: number, take: number, isActive?: boolean) {
    const where: Prisma.PartyWhereInput = {};
    if (query) {
      Object.assign(
        where,
        buildSearchCondition(['party_name', 'gst_number', 'mobile', 'city'], query),
      );
    }
    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    const [data, total] = await Promise.all([
      PartiesRepository.findAll({ where, skip, take, orderBy: { party_name: 'asc' } }),
      PartiesRepository.count(where),
    ]);

    return { data, total };
  }

  static async getParty(id: string) {
    const party = await PartiesRepository.findById(id);
    if (!party) throw new NotFoundError('Party not found');
    return party;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateParty(id: string, data: any) {
    const party = await PartiesRepository.findById(id);
    if (!party) throw new NotFoundError('Party not found');

    if (data.gst_number && data.gst_number !== party.gst_number) {
      const existing = await PartiesRepository.findByGst(data.gst_number);
      if (existing) throw new BusinessError('GST Number already exists');
    }

    const partyType = data.party_type || party.party_type;
    const isCompany = partyType === PartyType.COMPANY;

    // Ensure if switching to market, we clear billing/payment types
    let billing_type = data.billing_type;
    let payment_type = data.payment_type;

    if (!isCompany) {
      billing_type = null;
      payment_type = null;
    }

    return PartiesRepository.update(id, {
      party_name: data.party_name,
      party_type: data.party_type,
      gst_number: data.gst_number === '' ? null : data.gst_number,
      contact_person: data.contact_person,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state,
      billing_type: billing_type,
      payment_type: payment_type,
    });
  }

  static async updateStatus(id: string, is_active: boolean) {
    const party = await PartiesRepository.findById(id);
    if (!party) throw new NotFoundError('Party not found');
    return PartiesRepository.update(id, { is_active });
  }
}
