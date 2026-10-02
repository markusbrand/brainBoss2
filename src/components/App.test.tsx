import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { LanguageProvider } from '../context/LanguageContext';
import { vi } from 'vitest';

// Mock dependencies that would otherwise cause issues during render
vi.mock('../utils/storage', () => ({
  loadParentConfig: () => ({ kids: [] }),
  getActiveKidProfile: () => ({ id: '1', gradeLevel: 'primary', dailyQuests: [], powerUps: {} }),
  getDirectParentSession: () => null,
  handleRedirectAuthResult: vi.fn().mockResolvedValue(null),
  subscribeToAuth: vi.fn(),
  fetchRemoteDbData: vi.fn().mockResolvedValue(false),
}));

vi.mock('../utils/audio', () => ({
  soundFx: {
    isMuted: () => false,
    playPop: vi.fn(),
    playCorrect: vi.fn(),
    toggleMute: vi.fn(),
  }
}));

describe('App component', () => {
  it('renders without crashing and shows auth check or login screen initially', () => {
    render(
      <LanguageProvider>
        <App />
      </LanguageProvider>
    );
    // Based on the mock, it either shows loading or login screen
    const loadingText = screen.queryByText(/Authentifizierung wird geprüft/i);
    const loginScreen = screen.queryByText(/login/i);
    expect(loadingText || loginScreen).toBeTruthy();
  });
});
