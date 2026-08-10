export interface User {
  id: string;
  username: string;
  full_name: string;
  role: string;
  status?: string;
  permissions?: string[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: User;
  };
}

export interface CurrentUserResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface AuthError {
  success: boolean;
  message: string;
  errors?: unknown[];
}
