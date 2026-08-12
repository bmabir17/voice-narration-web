import { vi, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SupportDetail from '../app.support.$id';

// Mock the api and supabase modules
vi.mock('~/lib/api', () => ({
  api: {
    support: {
      get: vi.fn()
    }
  }
}));

vi.mock('~/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn()
      }))
    })),
    removeChannel: vi.fn()
  }
}));

describe('SupportDetail', () => {
  const mockTicket = {
    id: '1',
    user_id: 'user-1',
    email: 'test@example.com',
    subject: 'Test Ticket',
    message: 'This is a test message',
    status: 'open',
    admin_read_at: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    plan_tier: 'free'
  };

  it('renders loading state initially', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/app/support/1']}>
        <SupportDetail />
      </MemoryRouter>
    );
    
    expect(container.textContent).toContain('Loading…');
  });

  it('renders ticket details when data is loaded', async () => {
    // Mock the api.support.get to return our test ticket
    const { api } = await import('~/lib/api');
    api.support.get.mockResolvedValue(mockTicket);
    
    render(
      <MemoryRouter initialEntries={['/app/support/1']}>
        <SupportDetail />
      </MemoryRouter>
    );
    
    // Wait for the component to load and display ticket details
    await waitFor(() => {
      expect(screen.getByText('Test Ticket')).toBeInTheDocument();
      expect(screen.getByText('This is a test message')).toBeInTheDocument();
    });
  });
});