import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  MessageSquare, 
  BookOpen, 
  Save, 
  Share2, 
  Download, 
  History, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  Sparkles,
  Bold,
  Italic,
  List as ListIcon,
  Link as LinkIcon,
  Quote,
  Type as TypeIcon,
  Search,
  Trash2,
  ChevronLeft,
  Clock,
  User,
  ArrowRight,
  Upload,
  Check,
  ChevronRight,
  File
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { INITIAL_PROPOSALS, DEFAULT_SECTIONS } from './constants';
import { Proposal, Section, Reference, AnalysisItem, WizardData } from './types';
import { chatWithAI } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const APPROACH_OPTIONS = [
  { 
    name: 'Consultoria', 
    services: ['Análise de Processos', 'Roadmap Estratégico', 'Assessment Tecnológico'] 
  },
  { 
    name: 'Desenvolvimento', 
    services: ['Arquitetura de Software', 'Desenvolvimento Fullstack', 'QA & Testes'] 
  },
  { 
    name: 'Migração Cloud', 
    services: ['Cloud Assessment', 'Migração Lift & Shift', 'Otimização de Custos'] 
  },
  { 
    name: 'Dados Eng', 
    services: ['Data Pipeline', 'Data Warehouse', 'ETL Processes'] 
  },
  { 
    name: 'Dados Ciência', 
    services: ['Modelagem Preditiva', 'Análise Estatística', 'Machine Learning'] 
  }
];

export default function App() {
  const [view, setView] = useState<'list' | 'editor' | 'wizard'>('list');
  const [proposals, setProposals] = useState<Proposal[]>(() => {
    const saved = localStorage.getItem('proposals');
    return saved ? JSON.parse(saved) : INITIAL_PROPOSALS;
  });
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  
  const [editorMode, setEditorMode] = useState<'txt' | 'wysiwyg'>('txt');
  const [rightPanelTab, setRightPanelTab] = useState<'chat' | 'refs' | 'analysis'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSaved, setLastSaved] = useState<string>(new Date().toLocaleTimeString());

  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    clientName: '',
    projectName: '',
    problemDescription: '',
    requestedServices: '',
    contractType: 'Preço Fechado',
    approach: 'Desenvolvimento',
    includedServices: []
  });

  useEffect(() => {
    localStorage.setItem('proposals', JSON.stringify(proposals));
    setLastSaved(new Date().toLocaleTimeString());
  }, [proposals]);

  const activeProposal = useMemo(() => 
    proposals.find(p => p.id === activeProposalId),
    [proposals, activeProposalId]
  );

  const activeSection = useMemo(() => {
    if (!activeProposal) return null;
    return activeProposal.sections.find(s => s.id === activeSectionId) || activeProposal.sections[0];
  }, [activeProposal, activeSectionId]);

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.client.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [proposals, searchTerm]);

  const handleCreateProposal = () => {
    setWizardStep(1);
    setWizardData({
      clientName: '',
      projectName: '',
      problemDescription: '',
      requestedServices: '',
      contractType: 'Preço Fechado',
      approach: 'Desenvolvimento',
      includedServices: []
    });
    setView('wizard');
  };

  const handleFinishWizard = () => {
    const newProposal: Proposal = {
      id: Math.random().toString(36).substr(2, 9),
      name: wizardData.projectName || 'Nova Proposta Comercial',
      client: wizardData.clientName || 'Cliente Exemplo',
      status: 'Draft',
      version: 'v1.0',
      lastModified: new Date().toISOString(),
      sections: JSON.parse(JSON.stringify(DEFAULT_SECTIONS))
    };
    
    // Pre-fill content based on wizard
    const contextSection = newProposal.sections.find(s => s.title.toLowerCase().includes('contexto') || s.title.toLowerCase().includes('introdução'));
    if (contextSection) {
      contextSection.content = `## Entendimento do Problema\n${wizardData.problemDescription}\n\n## Escopo de Serviços\n${wizardData.requestedServices}\n\n## Abordagem Selecionada: ${wizardData.approach}\n${wizardData.includedServices.map(s => `- ${s}`).join('\n')}`;
    }

    setProposals([newProposal, ...proposals]);
    handleOpenProposal(newProposal.id);
  };

  const handleDeleteProposal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta proposta?')) {
      setProposals(proposals.filter(p => p.id !== id));
      if (activeProposalId === id) {
        setView('list');
        setActiveProposalId(null);
      }
    }
  };

  const handleOpenProposal = (id: string) => {
    setActiveProposalId(id);
    const proposal = proposals.find(p => p.id === id);
    if (proposal) {
      setActiveSectionId(proposal.sections[0].id);
    }
    setView('editor');
    setChatMessages([]);
  };

  const handleUpdateProposalMetadata = (field: keyof Proposal, value: string) => {
    if (!activeProposalId) return;
    setProposals(prev => prev.map(p => {
      if (p.id === activeProposalId) {
        return { ...p, [field]: value, lastModified: new Date().toISOString() };
      }
      return p;
    }));
  };

  const handleAddSection = () => {
    if (!activeProposalId) return;
    const newSection: Section = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Nova Sessão',
      content: '',
      status: 'incomplete',
      score: 0
    };
    setProposals(prev => prev.map(p => {
      if (p.id === activeProposalId) {
        return { ...p, sections: [...p.sections, newSection], lastModified: new Date().toISOString() };
      }
      return p;
    }));
    setActiveSectionId(newSection.id);
  };

  const handleDeleteSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeProposal || activeProposal.sections.length <= 1) {
      alert('A proposta deve ter pelo menos uma sessão.');
      return;
    }
    if (confirm('Tem certeza que deseja excluir esta sessão?')) {
      setProposals(prev => prev.map(p => {
        if (p.id === activeProposalId) {
          const newSections = p.sections.filter(s => s.id !== id);
          return { ...p, sections: newSections, lastModified: new Date().toISOString() };
        }
        return p;
      }));
      if (activeSectionId === id) {
        setActiveSectionId(activeProposal.sections.find(s => s.id !== id)?.id || '');
      }
    }
  };

  const handleContentChange = (newContent: string) => {
    if (!activeProposalId) return;
    setProposals(prev => prev.map(p => {
      if (p.id === activeProposalId) {
        return {
          ...p,
          lastModified: new Date().toISOString(),
          sections: p.sections.map(s => 
            s.id === activeSectionId ? { ...s, content: newContent } : s
          )
        };
      }
      return p;
    }));
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeSection) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    const context = `
      Proposal: ${activeProposal?.name}
      Client: ${activeProposal?.client}
      Current Section: ${activeSection.title}
      Content: ${activeSection.content}
    `;

    const response = await chatWithAI(userMsg, context);
    setChatMessages(prev => [...prev, { role: 'ai', text: response || '' }]);
    setIsTyping(false);
  };

  const references: Reference[] = [
    { id: 'r1', title: 'Global Sales Playbook 2024', type: 'pdf', summary: 'Directrizes globais para propostas comerciais.' },
    { id: 'r2', title: 'Retail Case Study - Client X', type: 'doc', summary: 'Estudo de caso de transformação digital no varejo.' },
    { id: 'r3', title: 'Pricing Guide 2024', type: 'pdf', summary: 'Tabela de preços e modelos de licenciamento.' },
    { id: 'r4', title: 'CI&T Value Prop - AI', type: 'url', summary: 'Nossa proposta de valor para iniciativas de IA.' },
  ];

  const analysisItems: AnalysisItem[] = [
    { id: 'a1', type: 'critical', message: 'A sessão "Investimento" está vazia e é obrigatória para submissão.' },
    { id: 'a2', type: 'medium', message: 'O tom da introdução está muito técnico. Recomenda-se um tom mais executivo.' },
    { id: 'a3', type: 'suggestion', message: 'Considere adicionar um gráfico de ROI para fortalecer a proposta de valor.' },
    { id: 'a4', type: 'suggestion', message: 'A descrição da equipe pode ser mais detalhada com mini-bios.' },
  ];

  const overallScore = useMemo(() => {
    if (!activeProposal) return 0;
    const total = activeProposal.sections.reduce((acc, s) => acc + s.score, 0);
    return Math.round(total / activeProposal.sections.length);
  }, [activeProposal]);

  const completionPercent = useMemo(() => {
    if (!activeProposal) return 0;
    const completed = activeProposal.sections.filter(s => s.status === 'complete').length;
    return Math.round((completed / activeProposal.sections.length) * 100);
  }, [activeProposal]);

  if (view === 'list') {
    return (
      <div className="flex h-screen flex-col bg-[#f8f6f5] text-slate-900 font-sans overflow-hidden">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-[#fa5d52] text-white p-2 rounded-xl flex items-center justify-center shadow-lg shadow-[#fa5d52]/20">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">AI Proposal Studio</h1>
              <p className="text-xs text-slate-500 font-medium">Gerencie suas propostas comerciais inteligentes</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar propostas..." 
                className="pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm w-80 focus:ring-2 focus:ring-[#fa5d52]/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={handleCreateProposal}
              className="bg-[#fa5d52] hover:bg-[#e04d44] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#fa5d52]/20 flex items-center gap-2"
            >
              <Plus size={20} /> Nova Proposta
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredProposals.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleOpenProposal(p.id)}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#fa5d52]/30 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#fa5d52] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        p.status === 'Draft' ? "bg-slate-100 text-slate-600" :
                        p.status === 'Review' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {p.status}
                      </div>
                      <button 
                        onClick={(e) => handleDeleteProposal(p.id, e)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-[#fa5d52] transition-colors line-clamp-1">{p.name}</h3>
                    <p className="text-sm text-slate-500 font-medium mb-6">{p.client}</p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(p.lastModified).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><User size={14} /> v{p.version}</span>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="size-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                              {String.fromCharCode(64 + i)}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-[#fa5d52] font-bold text-sm">
                          Abrir <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {filteredProposals.length === 0 && (
              <div className="text-center py-20">
                <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Search size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhuma proposta encontrada</h3>
                <p className="text-slate-500">Tente ajustar sua pesquisa ou crie uma nova proposta.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (view === 'wizard') {
    return (
      <div className="flex h-screen flex-col bg-[#f8f6f5] text-slate-900 font-sans overflow-hidden">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Nova Proposta</h1>
              <p className="text-xs text-slate-500 font-medium">Passo {wizardStep} de 3</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(step => (
              <div 
                key={step} 
                className={cn(
                  "size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  wizardStep === step ? "bg-[#fa5d52] text-white shadow-lg shadow-[#fa5d52]/20" : 
                  wizardStep > step ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                )}
              >
                {wizardStep > step ? <Check size={16} /> : step}
              </div>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <AnimatePresence mode="wait">
              {wizardStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-12"
                >
                  <div className="text-center mb-10">
                    <div className="size-20 bg-[#fa5d52]/10 text-[#fa5d52] rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Upload size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Carregar Arquivos</h2>
                    <p className="text-slate-500">Faça upload de documentos de referência, RFPs ou briefings para alimentar a IA.</p>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-[#fa5d52]/50 transition-colors cursor-pointer bg-slate-50/50 group">
                    <div className="size-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <File size={32} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 mb-1">Arraste e solte arquivos aqui</p>
                    <p className="text-xs text-slate-400">ou clique para selecionar (PDF, DOCX, XLSX)</p>
                  </div>

                  <div className="mt-12 flex justify-end">
                    <button 
                      onClick={() => setWizardStep(2)}
                      className="bg-[#fa5d52] hover:bg-[#e04d44] text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-[#fa5d52]/20 flex items-center gap-2"
                    >
                      Próximo Passo <ChevronRight size={20} />
                    </button>
                  </div>
                </motion.div>
              )}

              {wizardStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-12"
                >
                  <h2 className="text-2xl font-black text-slate-900 mb-8">Confirmação do Entendimento</h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome do Cliente</label>
                        <input 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#fa5d52]/20 outline-none"
                          value={wizardData.clientName}
                          onChange={(e) => setWizardData({...wizardData, clientName: e.target.value})}
                          placeholder="Ex: Acme Corp"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome do Projeto</label>
                        <input 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#fa5d52]/20 outline-none"
                          value={wizardData.projectName}
                          onChange={(e) => setWizardData({...wizardData, projectName: e.target.value})}
                          placeholder="Ex: Transformação Digital 2024"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Problema ou Oportunidade</label>
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#fa5d52]/20 outline-none resize-none"
                        rows={3}
                        value={wizardData.problemDescription}
                        onChange={(e) => setWizardData({...wizardData, problemDescription: e.target.value})}
                        placeholder="Descreva o desafio do cliente..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Serviços Pedidos</label>
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#fa5d52]/20 outline-none resize-none"
                        rows={3}
                        value={wizardData.requestedServices}
                        onChange={(e) => setWizardData({...wizardData, requestedServices: e.target.value})}
                        placeholder="O que o cliente solicitou especificamente?"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tipo de Contratação</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Preço Fechado', 'Alocação', 'Squad'].map(type => (
                          <button
                            key={type}
                            onClick={() => setWizardData({...wizardData, contractType: type})}
                            className={cn(
                              "py-3 rounded-xl text-xs font-bold border transition-all",
                              wizardData.contractType === type ? "bg-[#fa5d52] border-[#fa5d52] text-white shadow-md" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 flex justify-between">
                    <button 
                      onClick={() => setWizardStep(1)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={() => setWizardStep(3)}
                      className="bg-[#fa5d52] hover:bg-[#e04d44] text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-[#fa5d52]/20 flex items-center gap-2"
                    >
                      Próximo Passo <ChevronRight size={20} />
                    </button>
                  </div>
                </motion.div>
              )}

              {wizardStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-12"
                >
                  <h2 className="text-2xl font-black text-slate-900 mb-8">Escolha da Abordagem</h2>
                  
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tipo de Oferta</label>
                      <div className="space-y-2">
                        {APPROACH_OPTIONS.map(opt => (
                          <button
                            key={opt.name}
                            onClick={() => setWizardData({
                              ...wizardData, 
                              approach: opt.name,
                              includedServices: opt.services
                            })}
                            className={cn(
                              "w-full text-left px-4 py-4 rounded-2xl border transition-all flex items-center justify-between group",
                              wizardData.approach === opt.name ? "bg-[#fa5d52]/5 border-[#fa5d52] text-[#fa5d52]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            )}
                          >
                            <span className="font-bold text-sm">{opt.name}</span>
                            <div className={cn(
                              "size-5 rounded-full border-2 flex items-center justify-center transition-all",
                              wizardData.approach === opt.name ? "border-[#fa5d52] bg-[#fa5d52] text-white" : "border-slate-200 group-hover:border-slate-300"
                            )}>
                              {wizardData.approach === opt.name && <Check size={12} />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Serviços Incluídos</label>
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
                        {wizardData.includedServices.map((service, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                            <div className="size-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                              <Check size={12} />
                            </div>
                            {service}
                          </div>
                        ))}
                        {wizardData.includedServices.length === 0 && (
                          <p className="text-xs text-slate-400 italic">Selecione uma abordagem para ver os serviços.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 flex justify-between">
                    <button 
                      onClick={() => setWizardStep(2)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={handleFinishWizard}
                      className="bg-[#fa5d52] hover:bg-[#e04d44] text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-[#fa5d52]/20 flex items-center gap-2"
                    >
                      Criar Proposta <Sparkles size={20} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    );
  }

  // Editor View
  return (
    <div className="flex h-screen flex-col bg-[#f8f6f5] text-slate-900 font-sans overflow-hidden">
      {/* Top Bar */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 z-10 shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setView('list')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-[#fa5d52] text-white p-1.5 rounded-lg flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <input 
                className="text-sm font-bold leading-none tracking-tight border-none p-0 focus:ring-0 w-64 bg-transparent outline-none" 
                value={activeProposal?.name || ''}
                onChange={(e) => handleUpdateProposalMetadata('name', e.target.value)}
                placeholder="Nome da Proposta"
              />
              <div className="flex items-center gap-2 mt-1">
                <input 
                  className="text-[10px] text-slate-500 font-medium border-none p-0 focus:ring-0 w-24 bg-transparent outline-none" 
                  value={activeProposal?.client || ''}
                  onChange={(e) => handleUpdateProposalMetadata('client', e.target.value)}
                  placeholder="Cliente"
                />
                <span className="text-slate-300">•</span>
                <input 
                  className="text-[10px] text-slate-500 font-medium border-none p-0 focus:ring-0 w-12 bg-transparent outline-none" 
                  value={activeProposal?.version || ''}
                  onChange={(e) => handleUpdateProposalMetadata('version', e.target.value)}
                  placeholder="v1.0"
                />
                <span className="text-slate-300">•</span>
                <select 
                  className="text-[10px] text-slate-500 font-medium border-none p-0 focus:ring-0 bg-transparent outline-none cursor-pointer"
                  value={activeProposal?.status || 'Draft'}
                  onChange={(e) => handleUpdateProposalMetadata('status', e.target.value as any)}
                >
                  <option value="Draft">Draft</option>
                  <option value="Review">Review</option>
                  <option value="Finalized">Finalized</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 border-r border-slate-200 pr-6 mr-2">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Score</p>
              <p className="text-sm font-bold text-[#fa5d52]">{overallScore}%</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Completude</p>
              <p className="text-sm font-bold text-slate-700">{completionPercent}%</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pendências</p>
              <p className="text-sm font-bold text-amber-500">3</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                handleUpdateProposalMetadata('lastModified', new Date().toISOString());
                alert('Proposta salva com sucesso!');
              }}
              title="Salvar" 
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            >
              <Save size={20} />
            </button>
            <button title="Histórico" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <History size={20} />
            </button>
            <button title="Exportar" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <Download size={20} />
            </button>
            <button title="Compartilhar" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
              <Share2 size={20} />
            </button>
            <button 
              onClick={() => {
                if (confirm('Deseja submeter esta proposta para revisão final?')) {
                  handleUpdateProposalMetadata('status', 'Review');
                  alert('Proposta submetida com sucesso!');
                }
              }}
              className="ml-2 bg-[#fa5d52] hover:bg-[#e04d44] text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
            >
              Submeter
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Sections */}
        <aside className="w-64 flex flex-col border-r border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sessões</h2>
            <button 
              onClick={handleAddSection}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-[#fa5d52] transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {activeProposal?.sections.map((section) => (
              <div key={section.id} className="relative group">
                <div
                  onClick={() => setActiveSectionId(section.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer",
                    activeSectionId === section.id 
                      ? "bg-[#fa5d52]/10 text-[#fa5d52] font-semibold border-r-4 border-[#fa5d52]" 
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <input 
                    className="bg-transparent border-none p-0 focus:ring-0 w-full cursor-pointer truncate outline-none"
                    value={section.title}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setProposals(prev => prev.map(p => p.id === activeProposalId ? {
                        ...p,
                        sections: p.sections.map(s => s.id === section.id ? { ...s, title: newTitle } : s)
                      } : p));
                    }}
                  />
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button 
                      onClick={(e) => handleDeleteSection(section.id, e)}
                      className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                    {section.status === 'complete' && <CheckCircle2 size={14} className="text-emerald-500" />}
                    {section.status === 'pending' && <AlertCircle size={14} className="text-amber-500" />}
                  </div>
                </div>
              </div>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="rounded-xl bg-[#1a237e] p-4 text-white shadow-lg">
              <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Templates</p>
              <p className="text-xs leading-relaxed mb-3">Use modelos pré-definidos para acelerar sua proposta.</p>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold py-2 rounded transition-colors uppercase">
                Ver Templates
              </button>
            </div>
          </div>
        </aside>

        {/* Central Panel - Editor */}
        <main className="flex-1 flex flex-col bg-[#f8f6f5] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-2 bg-white border-b border-slate-200">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setEditorMode('txt')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all",
                  editorMode === 'txt' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                (txt)
              </button>
              <button 
                onClick={() => setEditorMode('wysiwyg')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all",
                  editorMode === 'wysiwyg' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                (wysiwyg)
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-500"><Bold size={18} /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-500"><Italic size={18} /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-500"><ListIcon size={18} /></button>
              <div className="h-4 w-px bg-slate-200 mx-1"></div>
              <button className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-500"><LinkIcon size={18} /></button>
              <button className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-500"><Quote size={18} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto bg-white shadow-xl min-h-[1100px] p-16 md:p-20 rounded-sm relative">
              {editorMode === 'txt' ? (
                <textarea
                  className="w-full h-full min-h-[1000px] border-none focus:ring-0 p-0 text-slate-800 font-mono text-sm leading-relaxed resize-none"
                  value={activeSection?.content || ''}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Comece a escrever sua proposta em Markdown..."
                />
              ) : (
                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown>{activeSection?.content || ''}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Panel - AI Assistant */}
        <aside className="w-80 flex flex-col border-l border-slate-200 bg-white">
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setRightPanelTab('chat')}
              className={cn(
                "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                rightPanelTab === 'chat' ? "border-[#fa5d52] text-[#fa5d52]" : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Chat AI
            </button>
            <button 
              onClick={() => setRightPanelTab('refs')}
              className={cn(
                "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                rightPanelTab === 'refs' ? "border-[#fa5d52] text-[#fa5d52]" : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Referências
            </button>
            <button 
              onClick={() => setRightPanelTab('analysis')}
              className={cn(
                "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                rightPanelTab === 'analysis' ? "border-[#fa5d52] text-[#fa5d52]" : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Análise
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {rightPanelTab === 'chat' && (
                <motion.div 
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col p-4 overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar mb-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-8">
                        <div className="size-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                          <MessageSquare size={24} />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Como posso ajudar com a sessão <br/><strong>{activeSection?.title}</strong>?</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={cn(
                        "flex flex-col max-w-[90%]",
                        msg.role === 'user' ? "ml-auto items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "p-3 rounded-2xl text-xs leading-relaxed shadow-sm",
                          msg.role === 'user' 
                            ? "bg-[#fa5d52] text-white rounded-tr-none" 
                            : "bg-slate-100 text-slate-700 rounded-tl-none"
                        )}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex items-start gap-2">
                        <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:border-[#fa5d52]/50 transition-colors flex items-center gap-1">
                        <Sparkles size={12} /> Melhorar Texto
                      </button>
                      <button className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:border-[#fa5d52]/50 transition-colors flex items-center gap-1">
                        <TypeIcon size={12} /> Ajustar Tom
                      </button>
                    </div>
                    <div className="relative">
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-[#fa5d52] focus:border-[#fa5d52] resize-none pr-10"
                        placeholder="Pergunte algo à AI..."
                        rows={3}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      />
                      <button 
                        onClick={handleSendMessage}
                        className="absolute right-2.5 bottom-2.5 text-[#fa5d52] p-1 hover:bg-[#fa5d52]/10 rounded-full transition-colors"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {rightPanelTab === 'refs' && (
                <motion.div 
                  key="refs"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Documentos</h3>
                    <button className="text-[#fa5d52] text-[10px] font-bold hover:underline">Upload</button>
                  </div>
                  <div className="space-y-3">
                    {references.map((ref) => (
                      <div key={ref.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3 group hover:border-[#fa5d52]/30 transition-all cursor-pointer">
                        <div className="size-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center shrink-0">
                          <BookOpen size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate">{ref.title}</p>
                          <p className="text-[9px] text-slate-500 uppercase">{ref.type}</p>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 text-[#fa5d52] transition-opacity">
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {rightPanelTab === 'analysis' && (
                <motion.div 
                  key="analysis"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Qualidade</h3>
                      <span className="text-xs font-bold text-[#fa5d52]">{activeSection?.score || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#fa5d52]" style={{ width: `${activeSection?.score || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Pendências</h3>
                    {analysisItems.map((item) => (
                      <div key={item.id} className={cn(
                        "p-3 rounded-lg border flex gap-3",
                        item.type === 'critical' ? "bg-red-50 border-red-100" : 
                        item.type === 'medium' ? "bg-amber-50 border-amber-100" : "bg-blue-50 border-blue-100"
                      )}>
                        <div className={cn(
                          "shrink-0 mt-0.5",
                          item.type === 'critical' ? "text-red-500" : 
                          item.type === 'medium' ? "text-amber-500" : "text-blue-500"
                        )}>
                          <AlertCircle size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-medium text-slate-700 leading-tight">{item.message}</p>
                          <button className="mt-2 text-[10px] font-bold text-[#fa5d52] hover:underline flex items-center gap-1">
                            <Sparkles size={10} /> Corrigir com AI
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="h-8 border-t border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 text-[10px] text-slate-500 font-medium">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1"><History size={12} /> Último salvamento às {lastSaved}</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> Conectado ao Pipeline de AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="hover:text-[#fa5d52] transition-colors uppercase tracking-widest">Atalhos</button>
          <button className="hover:text-[#fa5d52] transition-colors uppercase tracking-widest">Documentação</button>
          <span className="text-slate-300">|</span>
          <span className="bg-[#fa5d52]/10 text-[#fa5d52] px-2 py-0.5 rounded font-bold uppercase">v2.4 Light</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
