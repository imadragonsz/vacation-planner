export type Vacation = {
  id: number;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  archived?: boolean;
  user_id?: string;
  owner_name?: string;
  vacation_participants?: { user_id: string }[];
};
