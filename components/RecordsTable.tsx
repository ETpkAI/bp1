
import React from 'react';
import { HealthRecord, Translations } from '../types.ts';
import { TrashIcon } from './Icons.tsx';

interface RecordsTableProps {
  records: HealthRecord[];
  deleteRecord: (id: string) => void;
  t: Translations;
  language: 'en' | 'zh';
  showAll?: boolean;
}

const getBPLevel = (systolic: number, diastolic: number) => {
  if (systolic < 120 && diastolic < 80) return { text: 'Normal', color: 'text-green-600' };
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) return { text: 'Elevated', color: 'text-yellow-600' };
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) return { text: 'High BP (S1)', color: 'text-orange-600' };
  if (systolic >= 140 || diastolic >= 90) return { text: 'High BP (S2)', color: 'text-red-600' };
  if (systolic > 180 || diastolic > 120) return { text: 'Crisis', color: 'text-red-800 font-bold' };
  return { text: 'N/A', color: 'text-gray-500' };
};


const RecordsTable: React.FC<RecordsTableProps> = ({ records, deleteRecord, t, language, showAll = false }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-white rounded-lg shadow">
        <p className="text-text-secondary">{t.noRecords as string}</p>
      </div>
    );
  }

  const recordsToShow = showAll ? records : records.slice(0, 10);
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">{t.date as string}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">{t.reading as string}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">{t.notes as string}</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">{t.actions as string}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recordsToShow.map((record) => {
              const bpLevel = getBPLevel(record.systolic, record.diastolic);
              return (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {new Date(record.timestamp).toLocaleString(locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-text-primary font-semibold">
                      {record.systolic} / {record.diastolic} <span className="text-xs text-text-secondary">mmHg</span>
                    </div>
                    <div className="text-sm text-text-secondary">
                      <span className="font-medium text-red-500">{record.heartRate}</span> bpm
                    </div>
                    <div className={`text-xs font-medium ${bpLevel.color}`}>{bpLevel.text}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate">{record.notes || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => deleteRecord(record.id)}
                      title={t.delete as string}
                      className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-100"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecordsTable;
