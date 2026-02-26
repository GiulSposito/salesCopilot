export interface Section {
  id: string;
  title: string;
  content: string;
  status: 'complete' | 'incomplete' | 'pending';
  score: number;
}

export interface Proposal {
  id: string;
  name: string;
  client: string;
  status: 'Draft' | 'Review' | 'Finalized';
  version: string;
  sections: Section[];
  lastModified: string;
}

export interface Reference {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'url';
  summary: string;
}

export interface AnalysisItem {
  id: string;
  type: 'critical' | 'medium' | 'suggestion';
  message: string;
}

export interface WizardData {
  clientName: string;
  projectName: string;
  problemDescription: string;
  requestedServices: string;
  contractType: string;
  approach: string;
  includedServices: string[];
}
