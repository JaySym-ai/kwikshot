// Changelog data for tracking changes
export interface ChangelogEntry {
  date: string;
  changes: string[];
}

export const changelogData: ChangelogEntry[] = [
  {
    date: '2025-06-18',
    changes: [
      'Refactored large components into smaller, reusable components for better maintainability',
      'Created custom hooks for tour management, recording logic, and streaming state',
      'Extracted UI components for headers, dialogs, and status indicators',
      'Improved code organization and separation of concerns'
    ]
  }
];
