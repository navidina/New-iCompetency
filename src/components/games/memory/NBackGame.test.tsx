import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NBackGame from './NBackGame';

describe('NBackGame', () => {
  test('renders initial state correctly', () => {
    render(<NBackGame onFinish={() => {}} />);
    expect(screen.getByText(/رادار تمرکز/i)).toBeInTheDocument();
    expect(screen.getByText('فعال‌سازی رادار')).toBeInTheDocument();
  });

  test('starts game on button click', () => {
    render(<NBackGame onFinish={() => {}} />);
    const startButton = screen.getByText('فعال‌سازی رادار');
    fireEvent.click(startButton);
    expect(screen.queryByText('فعال‌سازی رادار')).not.toBeInTheDocument();
    expect(screen.getByText(/تطبیق/i)).toBeInTheDocument();
  });
});
