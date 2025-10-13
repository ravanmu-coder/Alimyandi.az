import type { Meta, StoryObj } from '@storybook/react';
import { MainCarousel } from '../components/MainCarousel';

const meta: Meta<typeof MainCarousel> = {
  title: 'Components/MainCarousel',
  component: MainCarousel,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    autoPlay: {
      control: { type: 'boolean' },
      description: 'Whether to auto-play the carousel',
    },
    autoPlayInterval: {
      control: { type: 'number' },
      description: 'Auto-play interval in milliseconds',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleImages = [
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1549317336-206569e8475c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
];

const sampleVideos = [
  'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
];

export const Default: Story = {
  args: {
    images: sampleImages,
    videos: sampleVideos,
    autoPlay: false,
    autoPlayInterval: 3000,
  },
};

export const ImagesOnly: Story = {
  args: {
    images: sampleImages,
    autoPlay: false,
  },
};

export const WithAutoPlay: Story = {
  args: {
    images: sampleImages,
    autoPlay: true,
    autoPlayInterval: 2000,
  },
};

export const SingleImage: Story = {
  args: {
    images: [sampleImages[0]],
    autoPlay: false,
  },
};

export const Empty: Story = {
  args: {
    images: [],
    videos: [],
    autoPlay: false,
  },
};

export const ManyImages: Story = {
  args: {
    images: [
      ...sampleImages,
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    ],
    autoPlay: false,
  },
};
