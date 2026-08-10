export interface Setting {
  setting_key: string;
  setting_value: string | null;
  category: 'Company' | 'Numbering' | 'Documents' | 'Appearance' | 'System';
  description: string | null;
  updated_at: string;
}
