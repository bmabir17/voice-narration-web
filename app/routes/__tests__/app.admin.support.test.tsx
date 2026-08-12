import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminSupport from '../app.admin.support';

// Mock the api module
vi.mock('~/lib/api', () => ({
  api: {
    adminSupport: {
      list: vi.fn()
    }
  }
}));

describe('AdminSupport', () => {
  const mockTickets = [
    {
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
    }
  ];

  it('renders the admin support page with tickets', async () => {
    // Mock the api.adminSupport.list to return our test tickets
    const { api } = await import('~/lib/api');
    api.adminSupport.list.mockResolvedValue({ tickets: mockTickets, total: 1 });
    
    render(
      <MemoryRouter initialEntries={['/app/admin/support']}>
        <AdminSupport />
      </MemoryRouter>
    );
    
    // Check that the page renders correctly
    expect(screen.getByText('Support Tickets')).toBeInTheDocument();
    expect(screen.getByText('Test Ticket')).toBeInTheDocument();
  });
});