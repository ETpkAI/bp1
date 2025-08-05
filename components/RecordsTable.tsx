
import React, { useState, useMemo } from 'react';
import { HealthRecord, Translations } from '../types.ts';
import { TrashIcon } from './Icons.tsx';
import { getBPLevel } from '../utils/validation.ts';
import { useToast } from './ToastManager.tsx';

interface RecordsTableProps {
  records: HealthRecord[];
  deleteRecord: (id: string) => void;
  t: Translations;
  language: 'en' | 'zh';
  showAll?: boolean;
  pageSize?: number;
}


const RecordsTable: React.FC<RecordsTableProps> = ({ 
  records, 
  deleteRecord, 
  t, 
  language, 
  showAll = false,
  pageSize = 10 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast } = useToast();

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [records]);

  const totalPages = Math.ceil(sortedRecords.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  const recordsToShow = showAll 
    ? sortedRecords.slice(startIndex, endIndex)
    : sortedRecords.slice(0, pageSize);

  const locale = language === 'zh' ? 'zh-CN' : 'en-US';

  const handleDelete = (id: string) => {
    try {
      deleteRecord(id);
      showToast('记录已删除', 'success');
    } catch (error) {
      showToast('删除失败，请重试', 'error');
    }
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-white rounded-lg shadow">
        <p className="text-text-secondary">{t.noRecords as string}</p>
      </div>
    );
  }

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
                      onClick={() => handleDelete(record.id)}
                      title={t.delete as string}
                      className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-100"
                      aria-label={`删除记录 ${record.id}`}
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
      
      {/* 分页控件 */}
      {showAll && totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                显示第 <span className="font-medium">{startIndex + 1}</span> 到{' '}
                <span className="font-medium">{Math.min(endIndex, sortedRecords.length)}</span> 条，
                共 <span className="font-medium">{sortedRecords.length}</span> 条记录
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-brand-primary border-brand-primary text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordsTable;
