/**
 * Upload Service for Government ID & Customer Documents
 */

const API_BASE = '/api';

/**
 * Upload a document (Driver's License, Passport, Photo ID)
 * @param {File} file
 * @returns {Promise<{ success: boolean, fileUrl: string, filename: string, originalName: string, size: number }>}
 */
export async function uploadDocumentApi(file) {
  if (!file) {
    throw new Error('Please select a file to upload.');
  }

  // 10MB limit validation
  const MAX_SIZE_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('File exceeds the 10MB maximum limit. Please choose a smaller document.');
  }

  const formData = new FormData();
  formData.append('document', file);

  const res = await fetch(`${API_BASE}/upload/document`, {
    method: 'POST',
    body: formData,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    throw new Error(`Upload server returned non-JSON response (${res.status} ${res.statusText})`);
  }

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to upload document. Please try again.');
  }

  return data;
}

