import type { Meta, StoryObj } from '@storybook/react';
import { BidPanel } from '../components/BidPanel';
import { ToastProvider } from '../components/ToastProvider';

const meta: Meta<typeof BidPanel> = {
  title: 'Components/BidPanel',
  component: BidPanel,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <div className="w-96">
          <Story />
        </div>
      </ToastProvider>
    ),
  ],
  argTypes: {
    currentPrice: {
      control: { type: 'number' },
      description: 'Current bid price',
    },
    minBidIncrement: {
      control: { type: 'number' },
      description: 'Minimum bid increment',
    },
    isActive: {
      control: { type: 'boolean' },
      description: 'Whether the auction is active',
    },
    isReserveMet: {
      control: { type: 'boolean' },
      description: 'Whether the reserve price is met',
    },
    bidCount: {
      control: { type: 'number' },
      description: 'Number of bids placed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    auctionCarId: 'test-car-id',
    currentPrice: 1000,
    minBidIncrement: 25,
    isActive: true,
    isReserveMet: false,
    bidCount: 5,
    lastBidTime: '2025-01-27T14:30:00Z',
  },
};

export const WithReserve: Story = {
  args: {
    auctionCarId: 'test-car-id',
    currentPrice: 1200,
    minBidIncrement: 50,
    isActive: true,
    isReserveMet: false,
    reservePrice: 2000,
    bidCount: 12,
    lastBidTime: '2025-01-27T14:30:00Z',
  },
};

export const ReserveMet: Story = {
  args: {
    auctionCarId: 'test-car-id',
    currentPrice: 2500,
    minBidIncrement: 100,
    isActive: true,
    isReserveMet: true,
    reservePrice: 2000,
    bidCount: 25,
    lastBidTime: '2025-01-27T14:30:00Z',
  },
};

export const Inactive: Story = {
  args: {
    auctionCarId: 'test-car-id',
    currentPrice: 1000,
    minBidIncrement: 25,
    isActive: false,
    isReserveMet: false,
    bidCount: 5,
  },
};

export const NoBids: Story = {
  args: {
    auctionCarId: 'test-car-id',
    currentPrice: 500,
    minBidIncrement: 25,
    isActive: true,
    isReserveMet: false,
    bidCount: 0,
  },
};

export const HighValue: Story = {
  args: {
    auctionCarId: 'test-car-id',
    currentPrice: 50000,
    minBidIncrement: 500,
    isActive: true,
    isReserveMet: false,
    reservePrice: 75000,
    bidCount: 45,
    lastBidTime: '2025-01-27T14:30:00Z',
  },
};
