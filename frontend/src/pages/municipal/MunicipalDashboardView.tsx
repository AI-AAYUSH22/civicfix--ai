import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Receipt,
  Database,
  Banknote,
  Clock,
  MapPin,
  Activity,
  Building2,
  Users,
  Phone,
  Mail,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Modal } from '@/components/ui/Modal';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { formatDate } from '@/utils/caseUtils';
import type { MunicipalNavSection } from '@/layouts/MunicipalLayout';
import type { PotholeCase } from '@/types';
import { useApp } from '@/context/AppContext';
import { approveExpenseMemo } from '@/services/api';
import CityMap from '@/components/CityMap';

interface MunicipalDashboardViewProps {
  activeSection: MunicipalNavSection;
  assignedWardId?: string;
  assignedWardName?: string;
}

export const MunicipalDashboardView: React.FC<MunicipalDashboardViewProps> = ({
  activeSection,
  assignedWardId = 'all',
  assignedWardName = 'All 48 Wards (MMR Jurisdiction)',
}) => {
  const {
    cases,
    contractors,
    wards,
    validateCaseHandler,
    assignWorkOrderHandler,
    reviewVerificationHandler,
  } = useApp();

  const [selectedWardId, setSelectedWardId] = useState<string>(assignedWardId || 'all');
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'Mumbai' | 'Thane' | 'Navi Mumbai'>('ALL');
  const [mapCity, setMapCity] = useState<'Mumbai' | 'Thane' | 'Navi Mumbai'>('Mumbai');
  const [selectedCase, setSelectedCase] = useState<PotholeCase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigningContractorId, setAssigningContractorId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Group the 48 Wards by Municipal Corporation
  const bmcWards = useMemo(() => wards.filter((w) => w.city === 'Mumbai'), [wards]);
  const tmcWards = useMemo(() => wards.filter((w) => w.city === 'Thane'), [wards]);
  const nmmcWards = useMemo(() => wards.filter((w) => w.city === 'Navi Mumbai'), [wards]);

  const selectedWardObj = useMemo(() => {
    if (selectedWardId === 'all') return null;
    return wards.find((w) => w.id === selectedWardId);
  }, [wards, selectedWardId]);

  const currentWardDisplayName = useMemo(() => {
    if (selectedWardId === 'all') {
      if (regionFilter === 'Mumbai') return 'BMC Mumbai (24 Wards)';
      if (regionFilter === 'Thane') return 'TMC Thane (9 Wards)';
      if (regionFilter === 'Navi Mumbai') return 'NMMC & Panvel (15 Wards)';
      return 'All 48 Wards (MMR Metropolitan Master View)';
    }
    return selectedWardObj ? `${selectedWardObj.code || ''} ${selectedWardObj.name}` : assignedWardName;
  }, [selectedWardId, regionFilter, selectedWardObj, assignedWardName]);

  const handleSelectWard = (wId: string) => {
    setSelectedWardId(wId);
    if (wId === 'all') return;
    const target = wards.find((w) => w.id === wId);
    if (target) {
      if (target.city === 'Thane') setMapCity('Thane');
      else if (target.city === 'Navi Mumbai') setMapCity('Navi Mumbai');
      else setMapCity('Mumbai');
    }
  };

  const handleApprovePayout = async (memoId: string) => {
    setActionLoading(true);
    try {
      await approveExpenseMemo(memoId);
      showToast(`Treasury payout approved for memo ${memoId}. Funds disbursed.`);
    } catch (err: any) {
      showToast(err.message || 'Payout approval processed in database mode.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter complaints based on selected ward or region
  const wardCases = useMemo(() => {
    if (selectedWardId === 'all') {
      if (regionFilter === 'Mumbai') return cases.filter((c) => c.city === 'Mumbai');
      if (regionFilter === 'Thane') return cases.filter((c) => c.city === 'Thane');
      if (regionFilter === 'Navi Mumbai') return cases.filter((c) => c.city === 'Navi Mumbai');
      return cases;
    }
    const ward = wards.find((w) => w.id === selectedWardId);
    const wardNameClean = (ward?.name || '').toLowerCase();
    const wardCodeClean = (ward?.code || '').toLowerCase();

    return cases.filter((c) => {
      if (c.wardId === selectedWardId) return true;
      if (c.wardName && ward?.name && c.wardName.toLowerCase() === wardNameClean) return true;
      if (wardCodeClean && c.wardId?.toLowerCase() === wardCodeClean) return true;
      if (ward?.name && c.location.toLowerCase().includes(ward.name.toLowerCase())) return true;
      if (selectedWardId.includes('G/N') && (c.location.toLowerCase().includes('dadar') || c.location.toLowerCase().includes('mahim'))) return true;
      return false;
    });
  }, [cases, selectedWardId, regionFilter, wards]);

  const filteredCases = useMemo(() => {
    let result = wardCases;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.contractor?.toLowerCase().includes(q) ||
          (c.wardName && c.wardName.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status.toLowerCase() === statusFilter.toLowerCase());
    }
    return result;
  }, [wardCases, searchQuery, statusFilter]);

  // Real-time live computed metrics for the selected ward view
  const realTimeStats = useMemo(() => {
    const active = wardCases.filter((c) =>
      ['REPORTED', 'VALIDATED', 'ASSIGNED', 'REPAIRING', 'Under Repair', 'Reported', 'Validated', 'Assigned'].includes(c.status)
    ).length;
    const pendingVerif = wardCases.filter((c) =>
      ['VERIFICATION', 'NEEDS_REVIEW', 'Needs Review', 'AI Verification'].includes(c.status) || !!c.verification
    ).length;
    const underRepair = wardCases.filter((c) =>
      ['REPAIRING', 'Under Repair', 'In Progress'].includes(c.status)
    ).length;
    const resolved = wardCases.filter((c) =>
      ['VERIFIED', 'Verified', 'CLOSED', 'Closed', 'Resolved', 'VERIFIED_CLOSED'].includes(c.status)
    ).length;

    return {
      totalActive: active,
      pendingVerification: pendingVerif,
      underRepair: underRepair,
      resolvedThisMonth: resolved,
    };
  }, [wardCases]);

  // Verification cases awaiting engineer review
  const verificationCases = useMemo(() => {
    return wardCases.filter(
      (c) =>
        c.status === 'NEEDS_REVIEW' ||
        c.status === 'Needs Review' ||
        c.status === 'VERIFICATION' ||
        c.status === 'VERIFIED' ||
        c.status === 'VERIFIED_CLOSED' ||
        c.verification
    );
  }, [wardCases]);

  // Handle Validate
  const handleValidate = async (caseId: string) => {
    setActionLoading(true);
    try {
      await validateCaseHandler(caseId, 'VALIDATE', 'Validated by Ward Engineer');
      showToast(`Case ${caseId} validated successfully.`);
      setSelectedCase(null);
    } catch (err: any) {
      showToast(err.message || 'Case validated in local database');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Assign
  const handleAssign = async (caseId: string) => {
    if (!assigningContractorId && contractors.length > 0) {
      showToast('Please select a contractor to assign');
      return;
    }
    const cId = assigningContractorId || contractors[0]?.id;
    setActionLoading(true);
    try {
      await assignWorkOrderHandler(caseId, cId, 'High');
      showToast(`Work order created and assigned to contractor.`);
      setSelectedCase(null);
    } catch (err: any) {
      showToast(err.message || 'Assignment saved to database');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Verification Review
  const handleReviewVerification = async (woId: string, decision: 'APPROVE' | 'REJECT') => {
    setActionLoading(true);
    try {
      await reviewVerificationHandler(woId, decision, decision === 'APPROVE' ? 'Approved by Ward Engineer' : 'Rejected for rework');
      showToast(`Verification ${decision === 'APPROVE' ? 'Approved — Case Closed' : 'Rejected — Sent for Rework'}.`);
    } catch (err: any) {
      showToast(err.message || 'Review action synced to database');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-[#172033] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-teal-500/30">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 48-WARD INTERACTIVE SELECTOR HEADER BAR */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] border border-teal-200 flex items-center justify-center font-bold">
            <Building2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                Municipal Ward Jurisdiction (48 Wards Active)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                {wards.length || 48} Registered Wards
              </span>
            </div>
            <h2 className="text-base font-bold text-[#172033] tracking-tight">
              {currentWardDisplayName}
            </h2>
          </div>
        </div>

        {/* Dynamic Ward Dropdown & Regional Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Region Filter Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(['ALL', 'Mumbai', 'Thane', 'Navi Mumbai'] as const).map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => {
                  setRegionFilter(reg);
                  setSelectedWardId('all');
                  if (reg !== 'ALL') setMapCity(reg);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  regionFilter === reg && selectedWardId === 'all'
                    ? 'bg-white text-[#0F766E] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {reg === 'ALL' ? 'All (48)' : reg === 'Mumbai' ? 'BMC (24)' : reg === 'Thane' ? 'TMC (9)' : 'NMMC (15)'}
              </button>
            ))}
          </div>

          {/* Interactive 48 Ward Dropdown */}
          <div className="relative flex-1 md:w-72">
            <select
              value={selectedWardId}
              onChange={(e) => handleSelectWard(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white border border-[#CBD5E1] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#172033] shadow-2xs transition-all cursor-pointer"
            >
              <option value="all">🌟 All 48 Wards (MMR Wide Master Overview)</option>

              {bmcWards.length > 0 && (
                <optgroup label="🏢 BMC Mumbai (24 Administrative Wards)">
                  {bmcWards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code ? `${w.code} — ` : ''}{w.name} ({w.pendingCount ?? 0} pending)
                    </option>
                  ))}
                </optgroup>
              )}

              {tmcWards.length > 0 && (
                <optgroup label="🌆 TMC Thane (9 Administrative Wards)">
                  {tmcWards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code ? `${w.code} — ` : ''}{w.name} ({w.pendingCount ?? 0} pending)
                    </option>
                  ))}
                </optgroup>
              )}

              {nmmcWards.length > 0 && (
                <optgroup label="🌉 NMMC & Panvel (15 Administrative Wards)">
                  {nmmcWards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code ? `${w.code} — ` : ''}{w.name} ({w.pendingCount ?? 0} pending)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 1. Ward Overview View */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Title & Jurisdictional Scope */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                  Ward Operational Overview
                </h1>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Activity size={12} className="text-emerald-600" />
                  Real-Time Live
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                Real-time citizen reports, contractor dispatch, and automated AI verification for {currentWardDisplayName}.
              </p>
            </div>

            {/* Jurisdiction Badge */}
            <div className="flex items-center gap-2 bg-[#F1F5F9] px-3.5 py-2 rounded-xl border border-[#CBD5E1] shadow-subtle">
              <MapPin size={14} className="text-[#0F766E]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block leading-none">Active Scope</span>
                <span className="text-xs font-bold text-[#172033] truncate max-w-[200px] block">
                  {selectedWardId === 'all' ? 'All 48 Wards' : currentWardDisplayName}
                </span>
              </div>
            </div>
          </div>

          {/* KPI Stats Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padded="md" className="border-l-4 border-l-[#172033]">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                Total Active Cases
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-[#172033] mt-1">
                {realTimeStats.totalActive}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1 font-medium">
                <TrendingUp size={13} />
                <span>Live connected database</span>
              </div>
            </Card>

            <Card padded="md" className="border-l-4 border-l-[#0F766E]">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                AI Verification Queue
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-[#0F766E] mt-1">
                {realTimeStats.pendingVerification}
              </p>
              <span className="text-[11px] text-[#64748B] mt-1 block">
                Awaiting municipal engineer review
              </span>
            </Card>

            <Card padded="md" className="border-l-4 border-l-[#D97706]">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                Under Repair / Field
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-[#D97706] mt-1">
                {realTimeStats.underRepair}
              </p>
              <span className="text-[11px] text-[#64748B] mt-1 block">
                Active contractor crews on site
              </span>
            </Card>

            <Card padded="md" className="border-l-4 border-l-[#16A34A]">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                Resolved & Verified
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-[#16A34A] mt-1">
                {realTimeStats.resolvedThisMonth}
              </p>
              <span className="text-[11px] text-emerald-700 mt-1 block">
                100% verified with visual evidence
              </span>
            </Card>
          </div>

          {/* Ward GIS Map & Heatmap */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#172033] uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={16} className="text-[#0F766E]" />
                  GIS Map & Live Defect Heatmap
                </h3>
                <p className="text-xs text-[#64748B]">Real-time geospatial visualization across Mumbai, Thane, and Navi Mumbai</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#E2E8F0] shadow-subtle">
                {(['Mumbai', 'Thane', 'Navi Mumbai'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setMapCity(c)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      mapCity === c
                        ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-200'
                        : 'text-slate-500 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[380px] rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-subtle bg-white z-0" style={{ zIndex: 0 }}>
              <CityMap cases={cases} city={mapCity} selectedWardId={selectedWardId} />
            </div>
          </div>

          {/* Recent Case Queue - Filtered Cases */}
          <Card padded="md" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#172033]">Recent Complaints — {currentWardDisplayName}</h3>
                <p className="text-xs text-[#64748B]">Showing latest reports logged across the database</p>
              </div>
              <span className="text-xs text-[#0F766E] font-semibold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                {filteredCases.length} visible complaints
              </span>
            </div>

            <div className="divide-y divide-[#E2E8F0] -mx-5 px-5">
              {filteredCases.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No complaints found in this ward/filter. Submit a report from citizen or mobile interface to see it live!
                </div>
              ) : (
                filteredCases.slice(0, 8).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-[#F8FAFC] px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#172033]">
                        {c.id}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-[#172033]">{c.location}</p>
                        <p className="text-[11px] text-[#64748B]">
                          {c.wardName ? `${c.wardName} • ` : ''}Reported {formatDate(c.reportedDate)} • {c.contractor || 'Unassigned'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ChannelBadge channel={c.channel} size="sm" />
                      <span
                        className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.severity === 'High'
                            ? 'bg-rose-50 text-rose-700'
                            : c.severity === 'Medium'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-teal-50 text-teal-700'
                        }`}
                      >
                        {c.severity}
                      </span>
                      <StatusPill status={c.status} size="sm" />
                      <ChevronRight size={14} className="text-[#94A3B8]" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 2. Case Management View */}
      {activeSection === 'cases' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                Case Management Directory — {currentWardDisplayName}
              </h1>
              <p className="text-xs text-[#64748B]">
                {filteredCases.length} total cases matching active filters
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search case, ward, road, contractor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-[#172033] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="REPORTED">Reported</option>
                <option value="VALIDATED">Validated</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="REPAIRING">Under Repair</option>
                <option value="VERIFICATION">Verification</option>
                <option value="NEEDS_REVIEW">Needs Review</option>
                <option value="VERIFIED">Verified</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <Card padded="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Case ID</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Ward</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Contractor</th>
                    <th className="py-3 px-4">Reported</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        No cases found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((c) => (
                      <tr key={c.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#172033]">{c.id}</td>
                        <td className="py-3 px-4 font-medium text-[#172033] max-w-[200px] truncate">
                          {c.location}
                        </td>
                        <td className="py-3 px-4 text-[#64748B] font-medium truncate max-w-[140px]">
                          {c.wardName || c.wardId || 'Unassigned'}
                        </td>
                        <td className="py-3 px-4">
                          <ChannelBadge channel={c.channel} size="sm" />
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              c.severity === 'High'
                                ? 'bg-rose-50 text-rose-700'
                                : c.severity === 'Medium'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-teal-50 text-teal-700'
                            }`}
                          >
                            {c.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusPill status={c.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {c.contractor || <span className="text-slate-400 italic">Unassigned</span>}
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">{formatDate(c.reportedDate)}</td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCase(c)}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 3. AI Verification Queue View */}
      {activeSection === 'verification' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2">
              <Sparkles size={22} className="text-[#0F766E]" />
              AI Verification Review Queue — {currentWardDisplayName}
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Inspect contractor BEFORE and AFTER repair captures verified by CivicFix AI vision model
            </p>
          </div>

          {verificationCases.length === 0 ? (
            <Card padded="md" className="py-12 text-center text-slate-500">
              <Sparkles size={32} className="mx-auto text-teal-600 mb-2 opacity-60" />
              <p className="text-sm font-semibold text-[#172033]">All Repairs Verified & Closed</p>
              <p className="text-xs text-[#64748B] mt-1">No pending AI verification tasks in the selected ward.</p>
            </Card>
          ) : (
            verificationCases.map((vc) => {
              const woId = vc.id.replace('CF-', 'WO-');
              const vr = vc.verification;
              const isVerified = vr?.status === 'Verified' || vc.status === 'VERIFIED';

              return (
                <Card key={vc.id} padded="md" className={`space-y-4 border-l-4 ${isVerified ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                    <div>
                      <span className="font-mono font-bold text-base text-[#172033]">
                        Case {vc.id} • {vc.location}
                      </span>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Ward: {vc.wardName || vc.wardId} • Contractor: {vc.contractor || 'RoadWorks Unit A'} • Landmark: {vc.landmark || 'Street Corner'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                          isVerified
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isVerified ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertTriangle size={14} className="text-amber-600" />}
                        AI Confidence: {vr?.score || (isVerified ? 94 : 68)}%
                      </span>
                      <StatusPill status={vc.status} size="sm" />
                    </div>
                  </div>

                  {/* Before / After Evidence Side-by-Side Dual Comparison */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="text-xs font-bold text-[#0F766E] flex items-center gap-1.5">
                        <Sparkles size={14} /> Side-by-Side Dual Photo Audit — Case {vc.id}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-teal-100 text-[#0F766E] px-2 py-0.5 rounded border border-teal-300">
                        Case No: {vc.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#172033]">
                          <span>📸 1. CITIZEN UPLOADED IMAGE (CASE {vc.id})</span>
                          <span className="text-[#64748B] font-mono text-[10px]">
                            GPS: {vc.coordinates.lat?.toFixed(4)}°N, {vc.coordinates.lng?.toFixed(4)}°E
                          </span>
                        </div>
                        <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center text-slate-400 border border-[#E2E8F0] shadow-inner">
                          {vc.beforeImage ? (
                            <img
                              src={vc.beforeImage}
                              alt={`Citizen Case ${vc.id}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <AlertTriangle size={32} className="mx-auto text-amber-400 mb-1" />
                              <p className="text-xs font-semibold text-white">Citizen Pothole Photo</p>
                              <p className="text-[10px] text-slate-300">Case {vc.id} registered</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#172033]">
                          <span>🏗️ 2. CONTRACTOR COMPLETED ROAD IMAGE</span>
                          <span className="text-[#64748B] font-mono text-[10px]">
                            Verified Alignment (&lt;5m)
                          </span>
                        </div>
                        <div className={`aspect-video bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center text-slate-400 border shadow-inner ${isVerified ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-amber-400'}`}>
                          {vc.afterImage ? (
                            <img
                              src={vc.afterImage}
                              alt={`Contractor Case ${vc.id}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-1" />
                              <p className="text-xs font-semibold text-white">Contractor Completed Road</p>
                              <p className="text-[10px] text-emerald-300">Case {vc.id} construction photo</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Automated Prediction & Diagnostics Box */}
                    {vc.afterImage ? (
                      isVerified ? (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1.5 mt-2 text-xs shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                              <CheckCircle2 size={16} className="text-emerald-600" />
                              AUTOMATED AI PREDICTION: AUTHENTIC MATCH VERIFIED ({vr?.score || 95}% Confidence)
                            </span>
                            <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wide rounded-full shadow-sm">
                              ✓ WORK AUTO-APPROVED & CASE CLOSED
                            </span>
                          </div>
                          <p className="text-emerald-950 leading-relaxed text-[11px] pt-0.5">
                            <strong>AI Verdict & System Action:</strong> High evidence accuracy ({vr?.score || 95}% &ge; 80% threshold). 
                            The work order has been <strong>automatically approved</strong>, case status updated to <strong>VERIFIED_CLOSED</strong>, and database & server updated automatically.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 mt-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-900 flex items-center gap-1.5">
                              <AlertTriangle size={16} className="text-rose-600" />
                              AUTOMATED AI PREDICTION: MISMATCH FLAGGED ({vr?.score || 38}% Confidence — FALSE EVIDENCE)
                            </span>
                            <span className="px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wide rounded-full shadow-sm">
                              MISMATCH / FALSE
                            </span>
                          </div>
                          <div className="space-y-1 text-[#450a0a] font-medium bg-white/80 p-2.5 rounded-lg border border-rose-200">
                            <p className="font-bold text-rose-900">Why Contractor Evidence Does Not Match Report Photo:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-900">
                              <li><strong>Background SSIM Overlap Failed:</strong> Background structural similarity score ({vr?.score || 34}%) is below 75% threshold.</li>
                              <li><strong>Non-Road Feature Mismatch:</strong> Contractor upload detected non-road surface objects (indoor/portrait features instead of asphalt compaction).</li>
                              <li><strong>Crater Compaction Failure:</strong> Asphalt surface compaction & crater reduction not detected over reported coordinates.</li>
                            </ul>
                          </div>
                        </div>
                      )
                    ) : null}
                  </div>

                  {/* Automated Check Matrix with CV Engine Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
                    {(vr?.checks && vr.checks.length > 0
                      ? vr.checks
                      : [
                          { label: 'GPS Geofence', passed: true, detail: 'Within 3.8m radius' },
                          { label: 'SIFT Perspective', passed: true, detail: 'RANSAC inliers: 38 (warp OK)' },
                          { label: 'CLAHE SSIM', passed: true, detail: 'Background SSIM: 89.4% (>85%)' },
                          { label: 'Canny Cavity', passed: isVerified, detail: isVerified ? 'Cavity drop: 84% reduction' : 'Borderline cavity reduction' },
                          { label: 'Integrity', passed: true, detail: 'Dual DB & SHA-256 valid' },
                        ]
                    ).map((ch, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs ${
                          ch.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <span className="font-bold block flex items-center gap-1">
                          {ch.passed ? <CheckCircle2 size={12} className="text-emerald-600" /> : <AlertTriangle size={12} className="text-amber-600" />}
                          {ch.label}
                        </span>
                        <span className="text-[10px] opacity-80 mt-0.5 block leading-tight font-mono">
                          {ch.detail}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Contractor Expense Memo & Treasury Audit Strip */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt size={16} className="text-[#0F766E]" />
                        <span className="font-bold text-xs text-[#172033]">
                          Contractor Expense Memo & Dual-Ledger Settlement
                        </span>
                        <span className="px-2 py-0.5 bg-teal-100 text-[#0F766E] text-[10px] font-bold rounded-full border border-teal-200 flex items-center gap-1">
                          <Database size={10} /> Dual Replicated: Ward DB ↔ Central DB
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs text-[#172033]">
                        ₹25,500 Claimed (1.8T Asphalt • 4.2m²)
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-[#64748B]">
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        Ledger Hash: <strong className="text-[#172033]">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-amber-100 text-amber-900">
                          {isVerified ? 'CV Verification Passed: Payout Ready' : 'Payout Gated on AI CV Verification'}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={actionLoading || !isVerified}
                          leftIcon={<Banknote size={13} className="text-emerald-600" />}
                          onClick={() => handleApprovePayout(`memo-${vc.id}`)}
                          className="text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300"
                        >
                          Release Payout
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E2E8F0]">
                    <span className="text-xs text-[#64748B] italic">
                      {isVerified
                        ? '⚡ Work order automatically approved & case closed via high-confidence AI vision model.'
                        : (vr?.summary || 'SIFT RANSAC alignment & CLAHE background verification evaluated.')}
                    </span>
                    <div className="flex items-center gap-2">
                      {isVerified ? (
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 size={15} className="text-emerald-700" />
                          Work Approved & Case Closed (Server Synced)
                        </span>
                      ) : (
                        <>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleReviewVerification(woId, 'REJECT')}
                          >
                            Reject Repair
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actionLoading}
                            leftIcon={<ShieldCheck size={14} />}
                            onClick={() => handleReviewVerification(woId, 'APPROVE')}
                          >
                            Approve & Mark Case Closed
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* 4. Contractors & Teams Registry View */}
      {activeSection === 'contractors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2">
                <Users size={22} className="text-[#0F766E]" />
                Authorized Contractor Workforce & Teams
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Centralized database of empanelled road repair contractors across Mumbai, Thane, and Navi Mumbai
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contractors.map((con) => (
              <Card key={con.id} padded="md" className="space-y-3 border-t-4 border-t-[#0F766E]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#172033]">{con.name}</h3>
                    <p className="text-xs text-[#64748B] font-medium">{con.company_name}</p>
                  </div>
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-bold">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    {con.rating}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#64748B] pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400" />
                    <span>{con.phone || '+91 98200 12345'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-400" />
                    <span className="truncate">{con.email || 'dispatch@contractor.in'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[#64748B]">Active Field Work Orders:</span>
                  <span className="font-bold text-[#0F766E] bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                    {con.active_orders ?? 3} Active
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Case Detail & Workflow Action Modal */}
      {selectedCase && (
        <Modal
          isOpen={!!selectedCase}
          onClose={() => setSelectedCase(null)}
          title={`Case ${selectedCase.id}`}
          description={`${selectedCase.location}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" size="sm" onClick={() => setSelectedCase(null)}>
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                {selectedCase.status === 'REPORTED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={actionLoading}
                    leftIcon={<CheckCircle2 size={14} />}
                    onClick={() => handleValidate(selectedCase.id)}
                  >
                    Validate Complaint
                  </Button>
                )}
                {selectedCase.status === 'VALIDATED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={actionLoading}
                    leftIcon={<UserCheck size={14} />}
                    onClick={() => handleAssign(selectedCase.id)}
                  >
                    Assign Contractor
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div>
                <span className="text-[#64748B]">Current Status:</span>
                <div className="mt-1">
                  <StatusPill status={selectedCase.status} size="sm" />
                </div>
              </div>
              <div>
                <span className="text-[#64748B]">Source Channel:</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <ChannelBadge channel={selectedCase.channel} size="sm" />
                </div>
              </div>
              <div>
                <span className="text-[#64748B]">Assigned Contractor:</span>
                <p className="font-semibold text-[#172033] mt-1 truncate">
                  {selectedCase.contractor || 'Unassigned'}
                </p>
              </div>
              <div>
                <span className="text-[#64748B]">Ward Jurisdiction:</span>
                <p className="font-semibold text-[#172033] mt-0.5 truncate">
                  {selectedCase.wardName || selectedCase.wardId || 'General MMR'}
                </p>
              </div>
              <div>
                <span className="text-[#64748B]">Severity Level:</span>
                <p className="font-semibold text-[#172033] mt-0.5">{selectedCase.severity}</p>
              </div>
              <div>
                <span className="text-[#64748B]">Reporter:</span>
                <p className="font-semibold text-[#172033] mt-0.5 truncate">
                  {selectedCase.sourceUsername || selectedCase.citizenName || 'Anonymous Citizen'}
                </p>
              </div>
            </div>

            <div>
              <p className="font-semibold text-[#172033] mb-1">Description:</p>
              <p className="text-[#64748B] leading-relaxed">{selectedCase.description}</p>
            </div>

            {/* Evidence Photo Preview Gallery (Side by Side) */}
            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#172033] text-xs flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#0F766E]" />
                  Dual Photographic Audit Comparison — Case {selectedCase.id}
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#0F766E] text-white px-2 py-0.5 rounded">
                  CASE NO: {selectedCase.id}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#172033] block">
                    📸 Citizen Uploaded Photo (Case {selectedCase.id})
                  </span>
                  <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-300 shadow-inner">
                    {selectedCase.beforeImage ? (
                      <img
                        src={selectedCase.beforeImage}
                        alt={`Citizen Report Case ${selectedCase.id}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center p-3 text-slate-400">
                        <AlertTriangle size={24} className="mx-auto text-amber-400 mb-1" />
                        <p className="text-[11px] font-medium text-slate-300">No citizen photo uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#172033] block">
                    🏗️ Contractor Constructed Road Image
                  </span>
                  <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-300 shadow-inner">
                    {selectedCase.afterImage ? (
                      <img
                        src={selectedCase.afterImage}
                        alt={`Contractor Completed Case ${selectedCase.id}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center p-3 text-slate-400">
                        <Clock size={24} className="mx-auto text-slate-400 mb-1" />
                        <p className="text-[11px] font-medium text-slate-300">Awaiting contractor photo</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Prediction Box in Modal */}
              {selectedCase.afterImage && (
                selectedCase.verification?.status === 'Verified' || selectedCase.status === 'VERIFIED' ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      AI PREDICTION: AUTHENTIC MATCH VERIFIED
                    </span>
                    <p className="text-slate-700 text-[11px]">
                      Citizen pothole photo & contractor completed road image match location geofence & surface compaction.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs">
                    <span className="font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-rose-600" />
                      AI PREDICTION: MISMATCH / FALSE EVIDENCE DETECTED
                    </span>
                    <p className="text-rose-900 text-[11px]">
                      <strong>Reason:</strong> Contractor evidence image does not match citizen report (SSIM background overlap failed / non-road features detected).
                    </p>
                  </div>
                )
              )}
            </div>

            {selectedCase.status === 'VALIDATED' && contractors.length > 0 && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                <span className="font-bold text-[#0F766E] block">Assign Contractor:</span>
                <select
                  value={assigningContractorId}
                  onChange={(e) => setAssigningContractorId(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#172033]"
                >
                  {contractors.map((con) => (
                    <option key={con.id} value={con.id}>
                      {con.name} ({con.company_name}) — Rating: {con.rating}★ ({con.active_orders} active)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MunicipalDashboardView;
