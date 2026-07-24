import React, { useState } from 'react';
import { Scenario, IndustryType, PersonalityType, AccentType, SpeakingMode, DifficultyLevel } from '../types';
import { Sliders, Plus, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  onSaveScenario: (scenario: Scenario) => void;
}

export const AdminPanel: React.FC<Props> = ({ onSaveScenario }) => {
  const [industry, setIndustry] = useState<IndustryType>('Employee Support');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Leave Request');
  const [mode, setMode] = useState<SpeakingMode>('Inbound Call');
  const [personality, setPersonality] = useState<PersonalityType>('Frustrated & Impatient');
  const [accent, setAccent] = useState<AccentType>('American');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Intermediate');
  const [customerName, setCustomerName] = useState('Alex Rivera');
  const [caseId, setCaseId] = useState(`SUP-${Math.floor(100000 + Math.random() * 900000)}`);
  const [issueSummary, setIssueSummary] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleAiAutoGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/scenarios/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          difficulty,
          personality,
          mode,
        }),
      });

      const data = await res.json();
      if (data.title) {
        setTitle(data.title);
        setCategory(data.category || 'Leave Request');
        setCustomerName(data.customerName || 'Alex Rivera');
        setCaseId(data.caseId || `CASE-${Date.now()}`);
        setIssueSummary(data.issueSummary || data.description);
        setInitialMessage(data.initialMessage || 'Hello, I need help with my support request right away!');
      }
    } catch (e) {
      console.error('Scenario auto-gen failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !initialMessage) return;

    const newScenario: Scenario = {
      id: `custom-${Date.now()}`,
      title,
      industry,
      category,
      mode,
      personality,
      accent,
      difficulty,
      description: issueSummary,
      customerName,
      caseId,
      customerDetails: {
        employeeId: 'EMP-102938',
        issueSummary,
        verificationFields: [
          { key: 'Employee ID', value: 'EMP-102938' },
          { key: 'Date of Birth', value: '05/18/1990' },
        ],
      },
      initialMessage,
      trainerRubric: {
        greetingRequired: true,
        verificationRequired: true,
        purposeStatementRequired: true,
        paraphrasingRequired: true,
        empathyRequired: true,
        policyExplanationRequired: true,
        ownershipRequired: true,
        closingRequired: true,
      },
    };

    onSaveScenario(newScenario);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Scenario Builder & Admin Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Custom Scenario Creator
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Create custom customer support call scenarios with specific caller personalities, accents, case notes, and security verification rules.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="font-bold text-white text-base">Scenario Configuration</h3>
          <button
            type="button"
            onClick={handleAiAutoGenerate}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-2 hover:bg-amber-500/30 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            {isGenerating ? 'Generating with Gemini AI...' : 'AI Auto-Generate Details'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Industry / Function</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value as IndustryType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500"
            >
              <option value="Employee Support">Employee Support & HR</option>
              <option value="Healthcare">Healthcare Support</option>
              <option value="Technical Support">Technical Support</option>
              <option value="Banking">Banking Support</option>
              <option value="Telecom">Telecom Support</option>
              <option value="E-commerce">E-commerce</option>
              <option value="General Customer Care">General Customer Care</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Personality & Tone</label>
            <select
              value={personality}
              onChange={(e) => setPersonality(e.target.value as PersonalityType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500"
            >
              <option value="Very Calm & Understanding">Very Calm & Understanding</option>
              <option value="Friendly & Polite">Friendly & Polite</option>
              <option value="Angry & Demanding">Angry & Demanding</option>
              <option value="Frustrated & Impatient">Frustrated & Impatient</option>
              <option value="Confused & Anxious">Confused & Anxious</option>
              <option value="Emotional / Crying">Emotional / Crying</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Scenario Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Maternity Leave Extension Approval Inquiry"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Customer / Caller Name</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Summary & Case Details</label>
          <textarea
            rows={3}
            value={issueSummary}
            onChange={(e) => setIssueSummary(e.target.value)}
            placeholder="Describe the customer's exact issue and background context..."
            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Opening Statement from Caller</label>
          <textarea
            rows={2}
            required
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            placeholder="e.g. 'Hi, my leave pay is still pending on AtoZ! Why hasn't it been approved?'"
            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500"
          />
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Custom Scenario Created and Saved to Your Library!
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" />
          Save Scenario to Practice Library
        </button>
      </form>
    </div>
  );
};
