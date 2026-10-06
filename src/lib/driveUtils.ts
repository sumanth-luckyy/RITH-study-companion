/**
 * Google Drive URL & ID Parsing and Normalization Utility
 *
 * Supports all standard Google Drive link formats:
 * - Folders: https://drive.google.com/drive/folders/{ID}
 * - Folders with account: https://drive.google.com/drive/u/0/folders/{ID}
 * - Files: https://drive.google.com/file/d/{ID}/view (or /edit)
 * - Open links: https://drive.google.com/open?id={ID}
 * - Export/uc: https://drive.google.com/uc?id={ID}
 * - Direct ID strings
 */

export interface ParsedDriveReference {
  valid: boolean;
  driveId: string;
  driveUrl: string;
  isFolder: boolean;
  error?: string;
}

/**
 * Extracts Google Drive ID from any standard Google Drive URL or bare ID string.
 */
export function extractDriveId(input: string): { driveId: string | null; isFolder: boolean } {
  if (!input || typeof input !== 'string') {
    return { driveId: null, isFolder: false };
  }

  const clean = input.trim();

  // Pattern 1: Folder in URL (e.g., /folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ)
  const folderMatch = clean.match(/\/folders\/([a-zA-Z0-9_-]{10,})/i);
  if (folderMatch && folderMatch[1]) {
    return { driveId: folderMatch[1], isFolder: true };
  }

  // Pattern 2: File in URL (e.g., /file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ)
  const fileMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/i);
  if (fileMatch && fileMatch[1]) {
    return { driveId: fileMatch[1], isFolder: false };
  }

  // Pattern 3: Query parameter id= (e.g., ?id=1aBcDeFgHiJkLmNoPqRsTuVwXyZ)
  const queryMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]{10,})/i);
  if (queryMatch && queryMatch[1]) {
    const isFolder = clean.includes('folder') || clean.includes('folders');
    return { driveId: queryMatch[1], isFolder };
  }

  // Pattern 4: Bare Google Drive ID (alphanumeric with hyphens/underscores, usually 25-50 chars)
  const bareMatch = clean.match(/^[a-zA-Z0-9_-]{15,60}$/);
  if (bareMatch) {
    return { driveId: clean, isFolder: true };
  }

  return { driveId: null, isFolder: false };
}

/**
 * Validates and normalizes a Google Drive link or ID into canonical format.
 */
export function parseAndNormalizeDriveUrl(input: string): ParsedDriveReference {
  if (!input || !input.trim()) {
    return {
      valid: false,
      driveId: '',
      driveUrl: '',
      isFolder: false,
      error: 'Google Drive URL or Drive ID is required.',
    };
  }

  const clean = input.trim();
  const { driveId, isFolder } = extractDriveId(clean);

  if (!driveId) {
    return {
      valid: false,
      driveId: '',
      driveUrl: '',
      isFolder: false,
      error: 'Invalid Google Drive link or ID. Please provide a valid drive.google.com link.',
    };
  }

  // Build canonical URL
  const canonicalUrl = isFolder
    ? `https://drive.google.com/drive/folders/${driveId}`
    : `https://drive.google.com/file/d/${driveId}/view`;

  return {
    valid: true,
    driveId,
    driveUrl: canonicalUrl,
    isFolder,
  };
}
