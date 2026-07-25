import React from 'react';
import { Scenario } from '../types';
import { X, FileText, UserCheck, ShieldAlert, BookOpen, AlertCircle } from 'lucide-react';

interface Props {
  scenario: Scenario;
  isOpen: boolean;
  onClose: () => void;
}

export const CaseNotesDrawer: React.FC<Props> = ({ scenario, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 h-full overflow-y-auto p-6 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-lg text-amber-300">Case Notes & Reference</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mt-6 flex-1">
          {/* Case Info Header */}
          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              Case ID: {scenario.caseId}
            </div>
            <h4 className="text-base font-bold text-white">{scenario.title}</h4>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                {scenario.industry}
              </span>
              <span>•</span>
              <span className="text-slate-300 font-medium">{scenario.category}</span>
            </div>
          </div>

          {/* Customer / Employee Profile */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Caller Profile
            </h5>
            <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="font-medium text-slate-200">{scenario.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Persona & Tone:</span>
                <span className="font-medium text-amber-300">{scenario.personality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Accent:</span>
                <span className="font-medium text-slate-200">{scenario.accent}</span>
              </div>
            </div>
          </div>

          {/* Verification Fields Standard */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Mandatory Security Verification
            </h5>
            <div className="bg-cyan-950/30 p-3.5 rounded-xl border border-cyan-800/40 text-xs space-y-2">
              <p className="text-cyan-200/90 font-medium">
                ⚠️ Verify at least two security parameters before disclosing confidential details:
              </p>
              <div className="space-y-1.5 pt-1">
                {scenario.customerDetails.verificationFields.map((field, i) => (
                  <div key={i} className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-cyan-900/30 font-mono text-cyan-300">
                    <span>{field.key}:</span>
                    <span className="font-bold">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Issue Summary */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              Issue & Claim Summary
            </h5>
            <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/50 text-sm text-slate-300 leading-relaxed">
              {scenario.customerDetails.issueSummary}
            </div>
          </div>

          {/* Standard Operating Policy Reference & SOP Guidelines */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Official Policy Reference & Operating SOP
            </h5>
            {scenario.customerDetails.policyDetails ? (
              <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/30 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                  <span className="font-bold text-indigo-200 text-xs">
                    {scenario.customerDetails.policyDetails.policyName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 font-mono text-[10px] text-indigo-300 font-bold">
                    {scenario.customerDetails.policyDetails.code}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold text-slate-300 text-[11px] block">Key Policy Rules & Guidelines:</span>
                  <ul className="space-y-1 text-slate-300 pl-1">
                    {scenario.customerDetails.policyDetails.keyRules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] space-y-1">
                  <span className="font-bold text-amber-400 uppercase text-[10px] block">Compliance Requirement:</span>
                  <p>{scenario.customerDetails.policyDetails.complianceRequirement}</p>
                </div>

                {scenario.customerDetails.policyDetails.referenceNote && (
                  <p className="text-[10px] text-slate-400 italic">
                    <b className="text-indigo-300 not-italic">Note:</b> {scenario.customerDetails.policyDetails.referenceNote}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/30 text-xs space-y-2 text-slate-300">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2 font-bold text-indigo-200">
                  <span>General Support Compliance & Policy Guidelines</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-[10px] text-indigo-300 font-mono">POL-SOP-GEN</span>
                </div>
                <ul className="space-y-1.5 pl-1 text-[11px]">
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-400">•</span>
                    <span><strong>Security Check:</strong> Never proceed to fulfill or modify cases without completing at least 2 identity parameters.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-400">•</span>
                    <span><strong>Documentation:</strong> Always update case notes with timestamped representative summaries.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-400">•</span>
                    <span><strong>Turnaround Expectation:</strong> Standard SLA is 24-48 business hours for official response.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Employee Support Trainer Checklist */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Support Quality Rubric Expectations
            </h5>
            <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Professional Branded Greeting ("Thank you for calling Employee Support...")</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Identity Verification prior to request discussion</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Paraphrase employee's main concern</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Sincere empathy & ownership statement</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Clear policy explanation without jargon</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 mt-6 text-center text-xs text-slate-500">
          Employee Support Communication Simulator
        </div>
      </div>
    </div>
  );
};
