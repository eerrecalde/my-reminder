import React from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleDot,
  Clock,
  EllipsisVertical,
  List,
  Pill,
  Plus,
  Square,
  SquareCheck,
  TriangleAlert,
  X,
  XCircle,
} from 'lucide-react-native';

const icons = {
  arrowLeft: ArrowLeft,
  calendar: CalendarDays,
  check: Check,
  checkCircle: CheckCircle,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  circle: Circle,
  circleDot: CircleDot,
  clock: Clock,
  list: List,
  moreVertical: EllipsisVertical,
  pill: Pill,
  plus: Plus,
  square: Square,
  squareCheck: SquareCheck,
  warning: TriangleAlert,
  x: X,
  xCircle: XCircle,
};

export function AppIcon({
  name,
  color,
}: {
  name: keyof typeof icons;
  color: string;
}) {
  const Icon = icons[name];
  return <Icon size={24} strokeWidth={2} color={color} accessible={false} />;
}
