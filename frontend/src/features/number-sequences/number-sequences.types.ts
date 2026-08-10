export interface NumberSequence {
  sequence_key: string;
  financial_year_id: string;
  current_number: number;
  prefix: string;
  suffix: string | null;
  padding: number;
  updated_at: string;
  financial_year?: {
    display_name: string;
  };
}
