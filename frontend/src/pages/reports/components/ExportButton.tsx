import React from 'react';
import { useExportReportMutation } from '../../../features/reports/reports.hooks';
import { Button } from '../../../components/form/Button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  reportType: 'MONTHLY_TRIPS' | 'PARTY_LEDGER' | 'VEHICLE_OWNER_LEDGER' | 'OUTSTANDING_REPORT' | 'PENDING_POD' | 'FINANCIAL_SUMMARY' | 'PROFIT_SUMMARY';
  format: 'EXCEL' | 'PDF';
  filters?: any;
  label?: string;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ reportType, format, filters, label, disabled }) => {
  const exportMutation = useExportReportMutation();

  const handleExport = async () => {
    try {
      const response = await exportMutation.mutateAsync({ reportType, format, filters });
      
      // Handle the blob response download
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'EXCEL' ? 'xlsx' : 'pdf';
      link.setAttribute('download', `${reportType.toLowerCase()}_export.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      toast.success(`${format} export generated successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Export failed');
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport} 
      isLoading={exportMutation.isPending}
      disabled={disabled || exportMutation.isPending}
      className="flex items-center gap-2"
    >
      <Download size={16} />
      {label || `Export ${format}`}
    </Button>
  );
};
