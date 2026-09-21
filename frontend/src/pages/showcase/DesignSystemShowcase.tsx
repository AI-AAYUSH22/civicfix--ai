import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Camera,
  Palette,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { CardSkeleton, StatsSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import type { CivicStatus } from '@/types';

export const DesignSystemShowcase: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [showSkeletons, setShowSkeletons] = useState(false);

  const statuses: CivicStatus[] = [
    'REPORTED',
    'VALIDATED',
    'ASSIGNED',
    'REPAIRING',
    'VERIFICATION',
    'VERIFIED',
    'NEEDS REVIEW',
    'NOT VERIFIED',
    'CLOSED',
  ];

  const colorTokens = [
    { name: 'Civic Green', hex: '#0F766E', token: 'bg-[#0F766E]', use: 'Primary CTAs, verified states' },
    { name: 'Deep Teal', hex: '#115E59', token: 'bg-[#115E59]', use: 'Hover states, accent active' },
    { name: 'Navy', hex: '#172033', token: 'bg-[#172033]', use: 'Headings, structure, contractor bar' },
    { name: 'Soft Navy', hex: '#334155', token: 'bg-[#334155]', use: 'Subheadings, secondary structure' },
    { name: 'Background', hex: '#F8FAFC', token: 'bg-[#F8FAFC]', use: 'Canvas background' },
    { name: 'Surface', hex: '#FFFFFF', token: 'bg-white', use: 'Cards and dialogs' },
    { name: 'Surface Muted', hex: '#F1F5F9', token: 'bg-[#F1F5F9]', use: 'Secondary inputs, wells' },
    { name: 'Border', hex: '#E2E8F0', token: 'bg-[#E2E8F0]', use: 'Dividers and card borders' },
  ];

  const statusTokens = [
    { name: 'Success / Verified', hex: '#16A34A', token: 'bg-[#16A34A]' },
    { name: 'Warning / Review', hex: '#D97706', token: 'bg-[#D97706]' },
    { name: 'Danger / Rejected', hex: '#DC2626', token: 'bg-[#DC2626]' },
    { name: 'Info / Active', hex: '#2563EB', token: 'bg-[#2563EB]' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-10">
      {/* Hero Intro */}
      <div className="bg-gradient-to-r from-[#172033] to-[#1e2d4a] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-[#0F766E]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F766E]/40 border border-[#0F766E] text-teal-200 text-xs font-medium">
            <Sparkles size={14} />
            <span>CivicFix AI Design System • Phase 1 Foundation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Design Tokens & Foundational UI Components
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Government-grade trust with consumer-app simplicity. Below are the design tokens,
            radius scales, animations, and reusable UI atoms powering the Citizen, Contractor,
            and Municipal applications.
          </p>
        </div>
      </div>

      {/* 1. Color Palette Tokens */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#172033] flex items-center gap-2">
              <Palette size={20} className="text-[#0F766E]" />
              Core Color Palette & Tokens
            </h2>
            <p className="text-xs text-[#64748B]">Exact HSL/hex tokens per the CivicFix specification</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {colorTokens.map((c) => (
            <Card key={c.name} padded="sm" className="space-y-2">
              <div className={`h-12 w-full rounded-xl ${c.token} border border-black/5 shadow-inner`} />
              <div>
                <p className="font-semibold text-xs text-[#172033]">{c.name}</p>
                <p className="font-mono text-[11px] text-[#64748B]">{c.hex}</p>
                <p className="text-[10px] text-[#94A3B8] mt-1 line-clamp-1">{c.use}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {statusTokens.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-3 p-3 bg-white border border-[#E2E8F0] rounded-xl shadow-subtle"
            >
              <div className={`w-8 h-8 rounded-lg ${c.token} shrink-0`} />
              <div>
                <p className="font-semibold text-xs text-[#172033]">{c.name}</p>
                <p className="font-mono text-[11px] text-[#64748B]">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. StatusPill Component */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033] flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#0F766E]" />
            StatusPill Component
          </h2>
          <p className="text-xs text-[#64748B]">
            All required states with standardized semantic colors, borders, and pulsing micro-indicators
          </p>
        </div>

        <Card padded="md">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2.5">
                Standard Size (md)
              </p>
              <div className="flex flex-wrap gap-2.5">
                {statuses.map((s) => (
                  <StatusPill key={s} status={s} />
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2.5">
                Compact Size (sm)
              </p>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <StatusPill key={s} status={s} size="sm" />
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Button Component */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033]">Button Component</h2>
          <p className="text-xs text-[#64748B]">
            Teal primary (#0F766E), secondary, outline, ghost, danger, with Framer Motion tap animations
          </p>
        </div>

        <Card padded="md" className="space-y-6">
          {/* Variants */}
          <div>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">
              Variants
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button variant="accent">Accent Navy</Button>
            </div>
          </div>

          {/* Sizes & States */}
          <div className="pt-4 border-t border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">
              Sizes & States
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="primary">Small (sm)</Button>
              <Button size="md" variant="primary">Medium (md)</Button>
              <Button size="lg" variant="primary">Large (lg)</Button>
              <Button
                variant="primary"
                leftIcon={<Camera size={16} />}
                isLoading={btnLoading}
                onClick={() => {
                  setBtnLoading(true);
                  setTimeout(() => setBtnLoading(false), 1500);
                }}
              >
                {btnLoading ? 'Processing...' : 'Click for Loading State'}
              </Button>
              <Button variant="secondary" disabled>Disabled State</Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Card Component */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033]">Card Component</h2>
          <p className="text-xs text-[#64748B]">
            Base card wrapper with 16px radius, subtle shadow, and interactive hover lift (cardHover)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Standard Card</CardTitle>
              <CardDescription>Default 16px radius with subtle border.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#64748B]">
                Provides clean grouping for content, stats, and citizen reports without visual clutter.
              </p>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-[#0F766E] font-medium">Static Surface</span>
            </CardFooter>
          </Card>

          <Card interactive onClick={() => alert('Interactive Card Clicked')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Interactive Card</CardTitle>
                <ChevronRight size={16} className="text-[#94A3B8]" />
              </div>
              <CardDescription>Hover over me to see the subtle lift effect.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#64748B]">
                Uses Framer Motion cardHover variant: y: -2, scale: 1.01 with standard civic ease.
              </p>
            </CardContent>
            <CardFooter>
              <StatusPill status="REPAIRING" size="sm" />
            </CardFooter>
          </Card>

          <Card elevation="lift">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription>Higher elevation for featured modules.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#64748B]">
                Used for primary call-to-actions, AI verification summaries, and active alerts.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="primary" size="sm" fullWidth>Action Button</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 5. Skeleton Loading System */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#172033]">Skeleton Loading Component</h2>
            <p className="text-xs text-[#64748B]">
              Shimmering pulse placeholders for cards, dashboards, and table rows to eliminate layout shifts
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => setShowSkeletons(!showSkeletons)}
          >
            {showSkeletons ? 'Show Normal Content' : 'Preview Skeletons'}
          </Button>
        </div>

        {showSkeletons ? (
          <div className="space-y-4">
            <StatsSkeleton count={4} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <TableRowSkeleton count={3} />
          </div>
        ) : (
          <Card padded="md" className="space-y-3">
            <p className="text-xs text-[#64748B]">
              Click <strong>"Preview Skeletons"</strong> above to inspect the shimmering skeleton layouts designed for dashboard loading, work orders, and complaint lists.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-xs text-[#64748B]">Active Complaints</span>
                <p className="text-xl font-bold text-[#172033]">18</p>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-xs text-[#64748B]">Under Repair</span>
                <p className="text-xl font-bold text-[#D97706]">7</p>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-xs text-[#64748B]">AI Verification</span>
                <p className="text-xl font-bold text-[#0F766E]">3</p>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-xs text-[#64748B]">Resolved Today</span>
                <p className="text-xl font-bold text-[#16A34A]">12</p>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* 6. Modal Component */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033]">Modal Component</h2>
          <p className="text-xs text-[#64748B]">
            20px radius, backdrop blur, Framer Motion entry/exit spring transitions, and keyboard accessibility
          </p>
        </div>

        <Card padded="md" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#172033]">Test Modal Dialog</p>
            <p className="text-xs text-[#64748B] mt-0.5">
              Opens an accessible modal container adhering to the CivicFix 20px radius standard.
            </p>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open Demo Modal
          </Button>
        </Card>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="CivicFix AI Verification Preview"
          description="Case CF-1023 • MG Road, Dadar West"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  alert('Verification Confirmed');
                  setModalOpen(false);
                }}
              >
                Confirm Verification
              </Button>
            </>
          }
        >
          <div className="space-y-3 py-1">
            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-start gap-3">
              <CheckCircle2 className="text-[#0F766E] shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-xs font-semibold text-[#115E59]">AI Location & Visual Match: 98.4%</p>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  GPS coordinates match contractor BEFORE and AFTER evidence captures within 1.2m radius.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-[#334155]">
              <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                <span className="text-[#64748B]">Contractor:</span>
                <span className="font-semibold text-[#172033]">RoadWorks Unit A</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                <span className="text-[#64748B]">Road Condition:</span>
                <span className="font-semibold text-[#16A34A]">Restored & Compacted</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#64748B]">Status:</span>
                <StatusPill status="VERIFIED" size="sm" />
              </div>
            </div>
          </div>
        </Modal>
      </section>
    </div>
  );
};

export default DesignSystemShowcase;
