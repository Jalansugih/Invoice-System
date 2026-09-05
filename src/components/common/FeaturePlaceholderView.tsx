import React from 'react';
import { ArrowLeft, Construction } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props { title: string; description: string; onBack?: () => void; }

export const FeaturePlaceholderView: React.FC<Props> = ({ title, description, onBack }) => (
  <div className="min-h-[55vh] flex items-center justify-center">
    <div className="max-w-xl w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Construction className="w-7 h-7" /></div>
      <h2 className="mt-5 text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      {onBack && <Button variant="outline" className="mt-5" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Kembali</Button>}
    </div>
  </div>
);
