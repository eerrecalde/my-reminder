import { NativeModules } from 'react-native';
import type { DailyMedicineInput } from './MedicineSetup';

export type ReminderType = 'medicine' | 'reminder';
export type Medicine = DailyMedicineInput & { id: string };
export type Outcome = 'completed' | 'skipped' | 'missed';
export type Occurrence = {
  medicineId: string;
  scheduledAt: number;
  outcome?: Outcome | null;
};
export type ReminderState = {
  enabled: boolean;
  exactAlarms: boolean;
  notifications: boolean;
  language: 'en' | 'es';
  medicines: Medicine[];
  todayDoses: Occurrence[];
  history: Occurrence[];
  upcoming: Occurrence[];
};
export interface ReminderRepository {
  state(): Promise<ReminderState>;
  setOutcome(
    id: string,
    at: number,
    outcome: Outcome | null,
  ): Promise<{
    previous: Outcome | null;
    revision: number;
    previousCleared: boolean;
    changed: boolean;
  }>;
  undoOutcome(
    id: string,
    at: number,
    previous: Outcome | null,
    revision: number,
    previousCleared: boolean,
  ): Promise<void>;
  clearHistory(): Promise<void>;
  save(name: string, instructions: string, times: string[]): Promise<void>;
  saveTyped(
    type: ReminderType,
    name: string,
    instructions: string,
    times: string[],
    mode: 'notification' | 'alarm',
  ): Promise<void>;
  openAlarmSettings(): void;
  openNotificationSettings(): void;
  testReminder(): void;
  selectTime(time: string): Promise<string | null>;
}
export const reminderRepository: ReminderRepository =
  NativeModules.ReminderRepository;
