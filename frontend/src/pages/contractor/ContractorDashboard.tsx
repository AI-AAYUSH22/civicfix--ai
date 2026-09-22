import React from 'react';
import { ContractorLayout } from '@/layouts/ContractorLayout';
import { ContractorHome } from '@/pages/contractor/ContractorHome';

export const ContractorDashboard: React.FC = () => {
  const [contractorFilter, setContractorFilter] = React.useState<string>('all');

  return (
    <ContractorLayout
      assignedCount={4}
      activeFilter={contractorFilter}
      onFilterChange={setContractorFilter}
      onOpenQuickCapture={() => alert('Launching Quick Camera Capture for active job')}
    >
      <ContractorHome filter={contractorFilter} />
    </ContractorLayout>
  );
};
