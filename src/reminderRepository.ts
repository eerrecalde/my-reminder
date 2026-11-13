import { NativeModules } from 'react-native';
import type { DailyMedicineInput } from './MedicineSetup';

export type ReminderType = 'medicine' | 'reminder';
export type Medicine = DailyMedicineInput & {
  id: string;
  status?: 'active' | 'paused';
};
export type Outcome = 'completed' | 'skipped' | 'missed';
export type Occurrence = {
  medicineId: string;
  name?: string;
  instructions?: string;
  type?: ReminderType;
  scheduledAt: number;
  outcome?: Outcome | null;
  outstanding?: boolean;
  actionable?: boolean;
  snoozed?: boolean;
};
export type FullScreenAccess = 'automatic' | 'allowed' | 'denied';
export type ReminderState = {
  enabled: boolean;
  exactAlarms: boolean;
  fullScreenAccess: FullScreenAccess;
  notifications: boolean;
  language: 'en' | 'es';
  languagePreference: 'system' | 'en' | 'es';
  medicines: Medicine[];
  todayDoses: Occurrence[];
  history: Occurrence[];
  upcoming: Occurrence[];
};
export interface ReminderRepository {
  state(): Promise<ReminderState>;
  setLanguage(language: 'system' | 'en' | 'es'): Promise<void>;
  selectSound(
    mode: 'notification' | 'alarm',
    current: string | null,
  ): Promise<string | null>;
  soundInfo(
    choice: string,
  ): Promise<{ available: boolean; title: string | null }>;
  soundDefaults(): Promise<{
    notification: string | null;
    alarm: string | null;
  }>;
  setSoundDefault(
    mode: 'notification' | 'alarm',
    choice: string | null,
  ): Promise<void>;
  snooze(id: string, at: number, minutes: number): Promise<void>;
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
  edit(
    id: string,
    type: ReminderType,
    name: string,
    instructions: string,
    times: string[],
    mode: 'notification' | 'alarm',
  ): Promise<void>;
  setStatus(id: string, status: 'active' | 'paused' | 'deleted'): Promise<void>;
  openAlarmSettings(): void;
  openFullScreenSettings(): Promise<void>;
  openNotificationSettings(): void;
  testReminder(): void;
  saveDated(
    type: ReminderType,
    name: string,
    instructions: string,
    times: string[],
    mode: 'notification' | 'alarm',
    startDate: string,
    endDate: string | null,
  ): Promise<void>;
  editDated(
    id: string,
    type: ReminderType,
    name: string,
    instructions: string,
    times: string[],
    mode: 'notification' | 'alarm',
    startDate: string,
    endDate: string | null,
  ): Promise<void>;
  saveScheduled(
    type: ReminderType,
    name: string,
    instructions: string,
    times: string[],
    mode: 'notification' | 'alarm',
    startDate: string,
    endDate: string | null,
    scheduleKind: 'daily' | 'weekday' | 'interval' | 'monthly',
    weekdays: number[],
    intervalHours: number | null,
    intervalAnchor: number | null,
    monthlyDay: number | null,
    shortMonthPolicy: 'last' | 'skip',
    notificationSound: string | null,
    alarmSound: string | null,
  ): Promise<string>;
  editScheduled(
    id: string,
    type: ReminderType,
    name: string,
    instructions: string,
    times: string[],
    mode: 'notification' | 'alarm',
    startDate: string,
    endDate: string | null,
    scheduleKind: 'daily' | 'weekday' | 'interval' | 'monthly',
    weekdays: number[],
    intervalHours: number | null,
    intervalAnchor: number | null,
    monthlyDay: number | null,
    shortMonthPolicy: 'last' | 'skip',
    notificationSound: string | null,
    alarmSound: string | null,
  ): Promise<void>;
  selectDate(date: string): Promise<string | null>;
  selectTime(time: string): Promise<string | null>;
}
export const reminderRepository: ReminderRepository =
  NativeModules.ReminderRepository;
