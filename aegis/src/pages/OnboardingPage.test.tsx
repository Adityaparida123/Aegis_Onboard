import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OnboardingPage } from './OnboardingPage';
import { uploadOffer } from '../api/upload.api';
import type { UploadResult } from '../api/upload.api';

vi.mock('../api/upload.api', () => ({
  uploadOffer: vi.fn()
}));

const mockUpload = vi.mocked(uploadOffer);

const payload: UploadResult = {
  upload: {},
  profile: {
    _id: 'e1',
    name: 'Alan Turing',
    email: 'alan@example.com',
    role: 'Software Engineer',
    department: 'Engineering',
    location: 'US',
    clearance: 'Confidential'
  },
  workflow: { _id: 'w1', title: 'Onboarding for Alan Turing', status: 'Waiting Approval' },
  plan: {
    tasks: [
      {
        _id: 't1',
        title: 'Provision IT access',
        department: 'IT',
        assignedDepartment: 'IT',
        dependencies: [],
        status: 'Pending',
        priority: 'High'
      }
    ],
    approvals: [{ resource: 'GitHub Admin', status: 'Pending' }]
  },
  approvals: [{ _id: 'a1', workflowId: 'w1', resource: 'GitHub Admin', status: 'Pending' }]
};

describe('OnboardingPage', () => {
  beforeEach(() => {
    mockUpload.mockReset();
  });

  it('renders the offer intake UI', () => {
    render(<OnboardingPage />);

    expect(screen.getByText('Upload and extract onboarding context')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop the offer letter PDF')).toBeInTheDocument();
  });

  it('uploads a dropped PDF and shows the generated workflow summary', async () => {
    mockUpload.mockResolvedValue(payload);

    render(<OnboardingPage />);
    const file = new File(['%PDF-1.4'], 'offer.pdf', { type: 'application/pdf' });
    const zone = screen.getByText('Drag and drop the offer letter PDF').closest('div') as HTMLDivElement;

    fireEvent.drop(zone, { dataTransfer: { files: [file] } });

    await waitFor(() => expect(screen.getByText('Alan Turing')).toBeInTheDocument());
    expect(screen.getByText('Provision IT access')).toBeInTheDocument();
    expect(screen.getByText('GitHub Admin')).toBeInTheDocument();
    expect(screen.getByText('Waiting Approval')).toBeInTheDocument();
    expect(mockUpload).toHaveBeenCalledTimes(1);
  });

  it('rejects non-PDF files', async () => {
    render(<OnboardingPage />);
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' });
    const zone = screen.getByText('Drag and drop the offer letter PDF').closest('div') as HTMLDivElement;

    fireEvent.drop(zone, { dataTransfer: { files: [file] } });

    expect(mockUpload).not.toHaveBeenCalled();
  });
});
