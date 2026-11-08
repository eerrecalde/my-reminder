import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import App from '../App';

jest.mock('react-native-safe-area-context', () => {
  const mock = jest.requireActual('react-native-safe-area-context/jest/mock');
  return mock.default;
});

test('shows the app name when opened', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  expect(renderer.root.findByType(Text).props.children).toBe('Pill Reminder');
});
