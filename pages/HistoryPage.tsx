
import React from 'react';
import { HealthRecord, Translations } from '../types.ts';
import RecordsTable from '../components/RecordsTable.tsx';
import { TrashIcon } from '../components/Icons.tsx';

interface HistoryPageProps {
  records: HealthRecord[];
  deleteRecord: (id: string) => void;
  clearAllRecords: () => void;
  t: Translations;
  language: 'en' | 'zh';
}

const HistoryPage: React.FC<HistoryPageProps> = ({ records, deleteRecord, clearAllRecords, t, language }) => {

  const handleClearAll = () => {
    if (window.confirm(t.confirmClear as string)) {
      clearAllRecords();
    }
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
      <RecordsTable records={records} deleteRecord={deleteRecord} t={t} showAll={true} language={language} />
    </div>
  );
};

export default HistoryPage;
