

import React, { useState } from 'react';
import { HealthRecord, Translations } from '../types.ts';

interface DataEntryFormProps {
  addRecord: (record: Omit<HealthRecord, 'id' | 'timestamp'>) => void;
  t: Translations;
}

const DataEntryForm: React.FC<DataEntryFormProps> = ({ addRecord, t }) => {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!systolic || !diastolic || !heartRate) {
      alert('Please fill in all required fields.');
      return;
    }

    addRecord({
      systolic: parseInt(systolic, 10),
      diastolic: parseInt(diastolic, 10),
      heartRate: parseInt(heartRate, 10),
      notes,
    });

    // Reset form
    setSystolic('');
    setDiastolic('');
    setHeartRate('');
    setNotes('');
  };
  
  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm";

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-text-primary mb-4">{t.addNewRecord as string}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="systolic" className="block text-sm font-medium text-text-secondary">{t.systolic as string}</label>
            <input type="number" id="systolic" value={systolic} onChange={e => setSystolic(e.target.value)} required className={inputClasses} />
          </div>
          <div>
            <label htmlFor="diastolic" className="block text-sm font-medium text-text-secondary">{t.diastolic as string}</label>
            <input type="number" id="diastolic" value={diastolic} onChange={e => setDiastolic(e.target.value)} required className={inputClasses} />
          </div>
          <div>
            <label htmlFor="heartRate" className="block text-sm font-medium text-text-secondary">{t.heartRate as string}</label>
            <input type="number" id="heartRate" value={heartRate} onChange={e => setHeartRate(e.target.value)} required className={inputClasses} />
          </div>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-text-secondary">{t.notes as string}</label>
          <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputClasses}></textarea>
        </div>
        <div>
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors">
            {t.saveRecord as string}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DataEntryForm;