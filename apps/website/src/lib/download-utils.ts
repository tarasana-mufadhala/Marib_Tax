export interface DownloadInfo {
  apkUrl: string;
  version: string;
  sizeMb: string;
  iosUrl?: string;
  notes?: string;
}

export const DEFAULT_DOWNLOAD_INFO: DownloadInfo = {
  apkUrl: '/downloads/marib-tax-v1.0.4.apk',
  version: 'v1.0.4',
  sizeMb: '24 MB',
  iosUrl: '',
  notes: 'الإصدار الرسمي المعتمد • متوافق مع Android 8.0+',
};

export function parseDownloadInfo(body?: string | null): DownloadInfo {
  if (!body?.trim()) return DEFAULT_DOWNLOAD_INFO;
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        apkUrl: parsed.apkUrl?.trim() || DEFAULT_DOWNLOAD_INFO.apkUrl,
        version: parsed.version?.trim() || DEFAULT_DOWNLOAD_INFO.version,
        sizeMb: parsed.sizeMb?.trim() || DEFAULT_DOWNLOAD_INFO.sizeMb,
        iosUrl: parsed.iosUrl?.trim() || '',
        notes: parsed.notes?.trim() || DEFAULT_DOWNLOAD_INFO.notes,
      };
    }
  } catch {
    return { ...DEFAULT_DOWNLOAD_INFO, apkUrl: body };
  }
  return DEFAULT_DOWNLOAD_INFO;
}
