import { render, screen } from '@testing-library/react-native';

import TodayScreen from '../index';

test('renders the Today screen', async () => {
  await render(<TodayScreen />);
  expect(screen.getByText('Today')).toBeTruthy();
});
