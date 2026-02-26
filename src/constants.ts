import { Proposal } from './types';

export const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: '1',
    name: 'Digital Transformation Strategy 2024',
    client: 'Global Retail Corp',
    status: 'Draft',
    version: 'v2.4',
    lastModified: '2024-02-26T10:00:00Z',
    sections: [
      {
        id: '1',
        title: '1. Executive Summary',
        content: '# Executive Summary\n\nCI&T is pleased to submit this proposal to partner with Global Retail Corp on your upcoming digital transformation initiative. This document outlines our strategic approach to modernizing your e-commerce ecosystem, integrating next-generation AI capabilities, and optimizing your supply chain visibility.',
        status: 'complete',
        score: 85,
      },
      {
        id: '2',
        title: '2. Contexto e Desafio',
        content: '# Contexto e Desafio\n\nO mercado de varejo está passando por uma mudança sem precedentes...',
        status: 'incomplete',
        score: 45,
      },
      {
        id: '3',
        title: '3. Proposta de Valor',
        content: '# Proposta de Valor\n\nNossa proposta foca em três pilares principais...',
        status: 'pending',
        score: 60,
      },
    ],
  },
  {
    id: '2',
    name: 'Cloud Migration Roadmap',
    client: 'FinTech Solutions',
    status: 'Review',
    version: 'v1.0',
    lastModified: '2024-02-25T15:30:00Z',
    sections: [
      {
        id: '1',
        title: '1. Introduction',
        content: '# Introduction\n\nCloud migration is a critical step for FinTech Solutions...',
        status: 'complete',
        score: 90,
      },
    ],
  },
  {
    id: '3',
    name: 'AI-Powered Customer Support',
    client: 'Telecom Brasil',
    status: 'Finalized',
    version: 'v3.2',
    lastModified: '2024-02-20T09:15:00Z',
    sections: [
      {
        id: '1',
        title: '1. Executive Summary',
        content: '# Executive Summary\n\nImplementing AI in customer support will revolutionize...',
        status: 'complete',
        score: 100,
      },
    ],
  },
];

export const DEFAULT_SECTIONS = [
  { id: '1', title: '1. Sumário Executivo', content: '', status: 'incomplete', score: 0 },
  { id: '2', title: '2. Contexto', content: '', status: 'incomplete', score: 0 },
  { id: '3', title: '3. Solução', content: '', status: 'incomplete', score: 0 },
  { id: '4', title: '4. Investimento', content: '', status: 'incomplete', score: 0 },
];
