import { NativeModules } from 'react-native';
import type { DailyMedicineInput } from './MedicineSetup';

export type Medicine = DailyMedicineInput & { id: string };
export type ReminderState = {
  enabled: boolean;
  exactAlarms: boolean;
  notifications: boolean;
  language: 'en' | 'es';
  medicines: Medicine[];
  todayDoses: { medicineId: string; scheduledAt: number }[];
};
export interface ReminderRepository {
  state(): Promise<ReminderState>;
  save(name: string, instructions: string, times: string[]): Promise<void>;
  openAlarmSettings(): void;
  openNotificationSettings(): void;
  testReminder(): void;
}
export const reminderRepository: ReminderRepository =
  NativeModules.ReminderRepository;
