import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CorsiBlockGame from './CorsiBlockGame';
// Note: Jest and RTL setup assumed to be present as per instructions

describe('CorsiBlockGame', () => {
  test('renders initial state correctly', () => {
    render(<CorsiBlockGame onFinish={() => {}} />);
    expect(screen.getByText(/امتیاز/i)).toBeInTheDocument();
    expect(screen.getByText(/سطح/i)).toBeInTheDocument();
    expect(screen.getByText('شروع بازی')).toBeInTheDocument();
  });

  test('starts game on button click', () => {
    render(<CorsiBlockGame onFinish={() => {}} />);
    const startButton = screen.getByText('شروع بازی');
    fireEvent.click(startButton);
    // After start, button should disappear or change state
    expect(screen.queryByText('شروع بازی')).not.toBeInTheDocument();
    expect(screen.getByText(/به الگو دقت کنید/i)).toBeInTheDocument();
  });
});
