import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api/v1';

describe('E2E: CA Role Authorization', () => {
  let adminToken = '';
  let caToken = '';
  let testPartyId = '';
  let testTripId = '';

  beforeAll(async () => {
    try {
      // 1. Login as superadmin to setup test data
      const adminRes = await axios.post(`${API_URL}/auth/login`, {
        username: 'superadmin',
        password: 'password123',
      });
      adminToken = adminRes.data.data.accessToken;

      // 2. Create a CA user for testing
      const caUsername = `ca_test_${Date.now()}`;
      await axios.post(`${API_URL}/users`, {
        username: caUsername,
        password: 'password123',
        full_name: 'CA Auditor',
        role: 'CA'
      }, { headers: { Authorization: `Bearer ${adminToken}` }});

      // 3. Login as CA
      const caRes = await axios.post(`${API_URL}/auth/login`, {
        username: caUsername,
        password: 'password123',
      });
      caToken = caRes.data.data.accessToken;

      // 4. Create some test data as Admin for the CA to read/attempt to mutate
      const partyRes = await axios.post(`${API_URL}/parties`, {
        party_name: `Test Party ${Date.now()}`,
        party_type: 'MARKET',
        city: 'Mumbai'
      }, { headers: { Authorization: `Bearer ${adminToken}` }});
      testPartyId = partyRes.data.data.id;

      const tripRes = await axios.post(`${API_URL}/trips`, {
        loading_date: new Date().toISOString(),
        party_id: testPartyId,
        from_city: 'Mumbai',
        to_city: 'Delhi',
        vehicle_number: 'MH01AA1111',
        driver_mobile: '9876543210',
        freight_rate: 50000
      }, { headers: { Authorization: `Bearer ${adminToken}` }});
      testTripId = tripRes.data.data.id;

    } catch (error) {
      console.error('Setup failed. Tests cannot continue.', error);
      throw error;
    }
  });

  // A. CA can access an allowed read endpoint.
  it('A. CA can access an allowed read endpoint (Trips)', async () => {
    const res = await axios.get(`${API_URL}/trips`, {
      headers: { Authorization: `Bearer ${caToken}` }
    });
    expect(res.status).toBe(200);
  });

  // B. CA cannot create a trip.
  it('B. CA cannot create a trip', async () => {
    try {
      await axios.post(`${API_URL}/trips`, {
        loading_date: new Date().toISOString(),
        party_id: testPartyId,
        from_city: 'A',
        to_city: 'B',
        vehicle_number: 'TEST',
        driver_mobile: '9876543210',
        freight_rate: 100
      }, { headers: { Authorization: `Bearer ${caToken}` }});
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  // C. CA cannot update a trip.
  it('C. CA cannot update a trip', async () => {
    try {
      await axios.put(`${API_URL}/trips/${testTripId}`, {
        from_city: 'Updated'
      }, { headers: { Authorization: `Bearer ${caToken}` }});
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  // D. CA cannot delete/soft-delete a trip.
  it('D. CA cannot soft-delete a trip', async () => {
    try {
      await axios.delete(`${API_URL}/trips/${testTripId}`, {
        headers: { Authorization: `Bearer ${caToken}` }
      });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  // E. CA cannot restore a trip.
  it('E. CA cannot restore a trip', async () => {
    try {
      await axios.post(`${API_URL}/trips/${testTripId}/restore`, {}, {
        headers: { Authorization: `Bearer ${caToken}` }
      });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  // F. CA cannot add a trip expense.
  it('F. CA cannot add a trip expense', async () => {
    try {
      await axios.post(`${API_URL}/trips/${testTripId}/expenses`, {
        expense_type: 'TOLL',
        amount: 1000,
        expense_date: new Date().toISOString()
      }, { headers: { Authorization: `Bearer ${caToken}` }});
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  // G. CA cannot generate a bill.
  it('G. CA cannot generate a bill', async () => {
    try {
      await axios.post(`${API_URL}/bills/generate`, {
        party_id: testPartyId,
        trip_ids: [testTripId],
        bill_type: 'CONSOLIDATED'
      }, { headers: { Authorization: `Bearer ${caToken}` }});
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  // H. CA cannot cancel a bill.
  it('H. CA cannot cancel a bill', async () => {
    try {
      await axios.post(`${API_URL}/bills/99999/cancel`, {
        reason: 'Test Cancel'
      }, { headers: { Authorization: `Bearer ${caToken}` }});
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  // I. CA cannot record a payment.
  it('I. CA cannot record a payment', async () => {
    try {
      await axios.post(`${API_URL}/payments`, {
        party_id: testPartyId,
        amount: 1000,
        payment_date: new Date().toISOString(),
        payment_mode: 'NEFT'
      }, { headers: { Authorization: `Bearer ${caToken}` }});
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  // J. CA cannot create/update/deactivate a party.
  it('J. CA cannot create or update a party', async () => {
    try {
      await axios.post(`${API_URL}/parties`, {
        party_name: 'CA Created Party',
        party_type: 'MARKET'
      }, { headers: { Authorization: `Bearer ${caToken}` }});
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }

    try {
      await axios.post(`${API_URL}/parties/${testPartyId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${caToken}` }
      });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  // K. CA cannot create a submission.
  it('K. CA cannot create a submission', async () => {
    try {
      await axios.post(`${API_URL}/submissions`, {
        party_id: testPartyId,
        bill_ids: []
      }, { headers: { Authorization: `Bearer ${caToken}` }});
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  // L. CA cannot upload/replace a document.
  it('L. CA cannot upload a document', async () => {
    try {
      await axios.post(`${API_URL}/uploads/session`, {
        file: 'test'
      }, { headers: { Authorization: `Bearer ${caToken}` }});
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  // M. CA cannot access user-management endpoints.
  it('M. CA cannot access user management endpoints', async () => {
    try {
      await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${caToken}` }
      });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  // N. CA cannot access settings endpoints.
  it('N. CA cannot access settings endpoints', async () => {
    try {
      await axios.get(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${caToken}` }
      });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  // O. CA can access permitted reports.
  it('O. CA can access permitted reports', async () => {
    const res = await axios.get(`${API_URL}/reports/outstanding`, {
      headers: { Authorization: `Bearer ${caToken}` }
    });
    expect(res.status).toBe(200);
  });

  // P. CA can access permitted export functionality.
  it('P. CA can access permitted export functionality', async () => {
    const res = await axios.post(`${API_URL}/reports/export`, {
      reportType: 'OUTSTANDING'
    }, {
      headers: { Authorization: `Bearer ${caToken}` }
    });
    // Even if it returns 400 for bad data, it shouldn't return 403.
    expect(res.status).not.toBe(403);
  });

  // Q. An ADMIN user retains the existing mutation capabilities.
  it('Q. An ADMIN user retains the existing mutation capabilities', async () => {
    // We use the admin token to prove mutation still works
    const res = await axios.post(`${API_URL}/parties`, {
      party_name: `Admin Created Party ${Date.now()}`,
      party_type: 'MARKET',
      city: 'Pune'
    }, { headers: { Authorization: `Bearer ${adminToken}` }});
    expect(res.status).toBe(201);
  });
});
