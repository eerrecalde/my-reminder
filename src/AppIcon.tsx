import React from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react-native';

const icons = { clock: Clock, chevronDown: ChevronDown, chevronUp: ChevronUp };

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
