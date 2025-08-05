
import React, { useState } from 'react';
import { HealthRecord, Translations } from '../types.ts';
import RecordsTable from '../components/RecordsTable.tsx';
import { TrashIcon } from '../components/Icons.tsx';
import ConfirmDialog from '../components/ConfirmDialog.tsx';
import { useToast } from '../components/ToastManager.tsx';

interface HistoryPageProps {
  records: HealthRecord[];
  deleteRecord: (id: string) => void;
  clearAllRecords: () => void;
  t: Translations;
  language: 'en' | 'zh';
}

const HistoryPage: React.FC<HistoryPageProps> = ({ records, deleteRecord, clearAllRecords, t, language }) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { showToast } = useToast();

  const handleClearAll = () => {
    setShowConfirmDialog(true);
  };

  const confirmClearAll = () => {
    try {
      clearAllRecords();
      showToast('所有记录已清除', 'success');
    } catch (error) {
      showToast('清除失败，请重试', 'error');
    }
    setShowConfirmDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-text-primary">{t.fullHistory as string}</h2>
        {records.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            {t.clearData as string}
          </button>
        )}
      </div>
      <RecordsTable records={records} deleteRecord={deleteRecord} t={t} showAll={true} language={language} pageSize={20} />
      
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="确认清除"
        message={t.confirmClear as string}
        confirmText="清除"
        cancelText="取消"
        onConfirm={confirmClearAll}
        onCancel={() => setShowConfirmDialog(false)}
        type="danger"
      />
    </div>
  );
};

export default HistoryPage;
