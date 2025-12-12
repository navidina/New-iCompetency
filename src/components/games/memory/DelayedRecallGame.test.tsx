import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DelayedRecallGame from './DelayedRecallGame';

describe('DelayedRecallGame', () => {
  test('renders initial state correctly', () => {
    render(<DelayedRecallGame onFinish={() => {}} />);
    expect(screen.getByText(/یادآوری کلمات/i)).toBeInTheDocument();
    expect(screen.getByText('شروع')).toBeInTheDocument();
  });

  test('starts learning on button click', () => {
    render(<DelayedRecallGame onFinish={() => {}} />);
    const startButton = screen.getByText('شروع');
    fireEvent.click(startButton);
    expect(screen.queryByText('شروع')).not.toBeInTheDocument();
    // It should show "displaying words..."
    expect(screen.getByText(/در حال نمایش کلمات/i)).toBeInTheDocument();
  });
});
