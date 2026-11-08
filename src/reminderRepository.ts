import { NativeModules } from 'react-native';
import type { DailyMedicineInput } from './MedicineSetup';

export type ReminderType = 'medicine' | 'reminder';
export type Medicine = DailyMedicineInput & { id: string; type: ReminderType };
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
  saveTyped(
    type: ReminderType,
    name: string,
    instructions: string,
    times: string[],
  ): Promise<void>;
  openAlarmSettings(): void;
  openNotificationSettings(): void;
  testReminder(): void;
  selectTime(time: string): Promise<string | null>;
}
export const reminderRepository: ReminderRepository =
  NativeModules.ReminderRepository;
