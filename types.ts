
export interface QCAnalysisResult {
  defectType: string;
  evidence: string;
  recommendations: string;
}

export interface ReferenceFile {
  id: string;
  name: string;
  type: 'image' | 'text' | 'pdf' | 'folder';
  size?: string;
  lastModified?: string;
  path?: string;
}

export interface InspectionRecord {
  id: string;
  timestamp: number;
  imageUrl: string;
  result: QCAnalysisResult;
}

export interface DriveConnection {
  isConnected: boolean;
  designatedSources: ReferenceFile[];
  lastSyncTimestamp: number | null;
}
