import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PairedAssociationGame from './PairedAssociationGame';

describe('PairedAssociationGame', () => {
  test('renders initial state correctly', () => {
    render(<PairedAssociationGame onFinish={() => {}} />);
    expect(screen.getByText(/جفت‌های پنهان/i)).toBeInTheDocument();
    expect(screen.getByText('شروع یادگیری')).toBeInTheDocument();
  });

  test('starts learning phase on button click', () => {
    render(<PairedAssociationGame onFinish={() => {}} />);
    const startButton = screen.getByText('شروع یادگیری');
    fireEvent.click(startButton);
    expect(screen.queryByText('شروع یادگیری')).not.toBeInTheDocument();
    expect(screen.getByText(/به خاطر بسپارید/i)).toBeInTheDocument();
  });
});
