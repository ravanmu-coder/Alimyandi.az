import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BidPanel } from '../components/BidPanel';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';

// Mock the hooks
jest.mock('../hooks/useAuth');
jest.mock('../components/ToastProvider');
jest.mock('../api/bids');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('BidPanel', () => {
  const mockAddToast = jest.fn();
  const mockOnBidPlaced = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com' },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    });

    mockUseToast.mockReturnValue({
      addToast: mockAddToast,
      toasts: [],
      removeToast: jest.fn(),
      clearToasts: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    auctionCarId: 'test-car-id',
    currentPrice: 1000,
    minBidIncrement: 25,
    isActive: true,
    isReserveMet: false,
    bidCount: 5,
    onBidPlaced: mockOnBidPlaced
  };

  it('renders current price correctly', () => {
    render(<BidPanel {...defaultProps} />);
    
    expect(screen.getByText('$1,000')).toBeInTheDocument();
    expect(screen.getByText('5 bids')).toBeInTheDocument();
  });

  it('displays minimum bid amount', () => {
    render(<BidPanel {...defaultProps} />);
    
    expect(screen.getByText('Minimum bid: $1,025')).toBeInTheDocument();
  });

  it('allows bid amount input', () => {
    render(<BidPanel {...defaultProps} />);
    
    const bidInput = screen.getByDisplayValue('1025');
    expect(bidInput).toBeInTheDocument();
    
    fireEvent.change(bidInput, { target: { value: '1100' } });
    expect(bidInput).toHaveValue(1100);
  });

  it('increments and decrements bid amount', () => {
    render(<BidPanel {...defaultProps} />);
    
    const incrementButton = screen.getByLabelText('Next image');
    const decrementButton = screen.getByLabelText('Previous image');
    
    fireEvent.click(incrementButton);
    expect(screen.getByDisplayValue('1050')).toBeInTheDocument();
    
    fireEvent.click(decrementButton);
    expect(screen.getByDisplayValue('1025')).toBeInTheDocument();
  });

  it('shows login message when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    });

    render(<BidPanel {...defaultProps} />);
    
    expect(screen.getByText('Please log in to place a bid')).toBeInTheDocument();
  });

  it('shows inactive message when auction is not active', () => {
    render(<BidPanel {...defaultProps} isActive={false} />);
    
    expect(screen.getByText('This auction is not currently active')).toBeInTheDocument();
  });

  it('toggles proxy bid option', () => {
    render(<BidPanel {...defaultProps} />);
    
    const proxyCheckbox = screen.getByLabelText(/Proxy Bid/);
    expect(proxyCheckbox).not.toBeChecked();
    
    fireEvent.click(proxyCheckbox);
    expect(proxyCheckbox).toBeChecked();
  });

  it('displays reserve status when available', () => {
    render(<BidPanel {...defaultProps} reservePrice={1500} isReserveMet={false} />);
    
    expect(screen.getByText('Reserve Not Met ($1,500)')).toBeInTheDocument();
  });

  it('shows correct reserve status when met', () => {
    render(<BidPanel {...defaultProps} reservePrice={1500} isReserveMet={true} />);
    
    expect(screen.getByText('Reserve Met ($1,500)')).toBeInTheDocument();
  });
});
