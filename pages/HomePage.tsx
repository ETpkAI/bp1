
import React, { useRef } from 'react';
import { HealthRecord, Translations } from '../types.ts';
import DataEntryForm from '../components/DataEntryForm.tsx';
import RecordsTable from '../components/RecordsTable.tsx';
import { UploadIcon, DownloadIcon } from '../components/Icons.tsx';
import AnalysisCard from '../components/AnalysisCard.tsx';

interface HomePageProps {
  records: HealthRecord[];
  addRecord: (record: Omit<HealthRecord, 'id' | 'timestamp'>) => void;
  importRecords: (newRecords: HealthRecord[]) => { importedCount: number; duplicateCount: number };
  deleteRecord: (id: string) => void;
  t: Translations;
  language: 'en' | 'zh';
}

// A more robust CSV parser that handles quoted fields with commas
const parseCSV = (text: string): { headers: string[], data: any[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 1) {
        throw new Error("CSV is empty or invalid.");
    }
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
        const values: string[] = [];
        let currentField = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && (i === 0 || line[i-1] !== '\\')) { // handle escaped quotes later if needed
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        values.push(currentField.trim()); // Add the last field

        return headers.reduce((obj, header, i) => {
            const value = values[i] || '';
            // Un-quote field
            if (value.startsWith('"') && value.endsWith('"')) {
                obj[header] = value.substring(1, value.length - 1).replace(/""/g, '"');
            } else {
                obj[header] = value;
            }
            return obj;
        }, {} as any);
    });
    return { headers, data };
};


const HomePage: React.FC<HomePageProps> = ({ records, addRecord, importRecords, deleteRecord, t, language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const headers = "id,systolic,diastolic,heartRate,notes,timestamp\n";
    const csvContent = records
      .map(r => `${r.id},${r.systolic},${r.diastolic},${r.heartRate},"${(r.notes || '').replace(/"/g, '""')}",${r.timestamp}`)
      .join("\n");

    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `vital-log-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { headers, data } = parseCSV(text);
        
        // Basic validation
        const requiredHeaders = ['systolic', 'diastolic', 'heartRate', 'timestamp'];
        if (!requiredHeaders.every(h => headers.includes(h))) {
            alert(t.importError as string);
            return;
        }

        const newRecords: HealthRecord[] = data.map((recordData, index) => {
          return {
            id: recordData.id || `${Date.now()}-${index}`,
            systolic: parseInt(recordData.systolic, 10),
            diastolic: parseInt(recordData.diastolic, 10),
            heartRate: parseInt(recordData.heartRate, 10),
            notes: recordData.notes || '',
            timestamp: recordData.timestamp,
          };
        }).filter(r => !isNaN(r.systolic) && !isNaN(r.diastolic) && !isNaN(r.heartRate) && r.timestamp);

        const { importedCount, duplicateCount } = importRecords(newRecords);
        const importSuccessMsg = (t.importSuccess as (count: number) => string)(importedCount);
        const importDuplicatesMsg = (t.importDuplicates as (count: number) => string)(duplicateCount);
        alert(`${importSuccessMsg}\n${importDuplicatesMsg}`);

      } catch (error) {
        console.error("Error importing CSV:", error);
        alert(t.importError as string);
      } finally {
        // Reset file input
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="space-y-6">
      <DataEntryForm addRecord={addRecord} t={t} />

      <AnalysisCard records={records} t={t} />

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-text-primary mb-4">{t.importExport as string}</h2>
        <div className="flex flex-col sm:flex-row gap-4">
           <button onClick={() => fileInputRef.current?.click()} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors">
             <UploadIcon className="h-5 w-5 mr-2 text-text-secondary" />
             {t.importCSV as string}
           </button>
           <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv" className="hidden" />

           <button onClick={handleExport} disabled={records.length === 0} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-text-primary bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors">
             <DownloadIcon className="h-5 w-5 mr-2 text-text-secondary" />
             {t.exportCSV as string}
           </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">{t.recentRecords as string}</h2>
        <RecordsTable records={records} deleteRecord={deleteRecord} t={t} language={language} />
      </div>
    </div>
  );
};

export default HomePage;
