import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="Nothing here" description="Check back later." />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Check back later.')).toBeInTheDocument();
  });

  it('renders an icon when provided', () => {
    render(<EmptyState title="No items" icon={<span>icon</span>} />);
    expect(screen.getByText('icon')).toBeInTheDocument();
  });
});
