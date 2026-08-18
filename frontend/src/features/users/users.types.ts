export interface User {
  id: string;
  username: string;
  full_name: string;
  mobile?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'CA';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  success: boolean;
  data: {
    data: User[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}
