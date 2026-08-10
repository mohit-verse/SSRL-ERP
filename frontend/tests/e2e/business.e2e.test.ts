import { describe, it, expect } from 'vitest';
import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api/v1';

describe('E2E: Business Rules & Validation Checks', () => {
  it('should reject unauthorized access to protected routes', async () => {
    try {
      await axios.get(`${API_URL}/dashboard`);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response?.status).toBe(401);
    }
  });
});
