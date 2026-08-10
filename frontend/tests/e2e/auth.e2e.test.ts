import { describe, it, expect } from 'vitest';
import axios from 'axios';

// Note: These tests assume a running backend environment at localhost:3000
// If the backend is not running, these tests will fail gracefully indicating environment blockers.
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api/v1';

describe('E2E: Authentication Flow', () => {
  let token = '';

  it('should reject invalid credentials', async () => {
    try {
      await axios.post(`${API_URL}/auth/login`, {
        username: 'invalid_user',
        password: 'wrong_password',
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response?.status).toBe(401);
    }
  });

  it('should login with valid credentials', async () => {
    const res = await axios.post(`${API_URL}/auth/login`, {
      username: 'superadmin',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.data.data).toHaveProperty('token');
    token = res.data.data.token;
  });

  it('should fetch user profile with token', async () => {
    const res = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(res.status).toBe(200);
    expect(res.data.data).toHaveProperty('username');
  });
});
