import { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

interface InvoiceItem {
  product: string;
  color_name: string;
  color_code: string;
  size: string;
  quantity: string;
  wholesale_price: string;
  [key: string]: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [rawText, setRawText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'data' | 'raw'>('data');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      // Use relative URL – Next.js proxy will forward to Flask during dev,
      // and on Vercel the /api/parse route is handled by the serverless function.
      const res = await axios.post('/api/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 130000,
      });
      if (res.data.error) {
        setError(res.data.error);
      } else {
        setItems(res.data.items || []);
        setRawText(res.data.raw_text || '');
        setActiveTab('data');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Request failed';
      setError(`Parse failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!items.length) return;
    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, 'parsed_invoice.xlsx');
  };

  const exportToCSV = () => {
    if (!items.length) return;
    const ws = XLSX.utils.json_to_sheet(items);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parsed_invoice.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalItems = items.length;
  const totalFields = items.length ? Object.keys(items[0]).length : 0;
  let totalValue = 0;
  if (items.length) {
    const qtyKey = Object.keys(items[0]).find(k => k.toLowerCase().includes('quantity'));
    const priceKey = Object.keys(items[0]).find(k => k.toLowerCase().includes('wholesale') || k.toLowerCase().includes('price'));
    if (qtyKey && priceKey) {
      totalValue = items.reduce((sum, item) => {
        const qty = parseFloat(item[qtyKey]) || 0;
        const price = parseFloat(item[priceKey]) || 0;
        return sum + qty * price;
      }, 0);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-8 py-5">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-indigo-400">⚡ SHOPKEEP</span>
            <span className="text-3xl font-bold text-slate-100">PARSER</span>
          </div>
          <div className={`px-4 py-1 rounded-full text-sm font-semibold ${
            error ? 'bg-red-900/50 text-red-300' : 
            items.length ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-700 text-slate-300'
          }`}>
            {error ? '✗ Error' : items.length ? '✓ Ready' : '● Idle'}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Control Panel */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-bold mb-1">📊 Control Panel</h2>
          <p className="text-slate-400 text-sm mb-6">Coordinate‑based size/quantity matching</p>
          
          <div className="flex flex-wrap gap-4">
            <label className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-xl cursor-pointer transition font-semibold">
              📤 Upload Document
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            </label>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-6 py-2.5 rounded-xl font-semibold transition"
            >
              {loading ? 'Processing...' : '🚀 Process Document'}
            </button>
            {items.length > 0 && (
              <>
                <button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl font-semibold">
                  📥 Excel
                </button>
                <button onClick={exportToCSV} className="bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 rounded-xl font-semibold">
                  📥 CSV
                </button>
              </>
            )}
          </div>
          {file && <p className="text-sm text-slate-400 mt-4">📄 {file.name}</p>}
          {error && <p className="text-red-400 mt-4">❌ {error}</p>}
        </div>

        {/* Stats */}
        {items.length > 0 && (
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
              <p className="text-slate-400 text-sm">Total Items</p>
              <p className="text-3xl font-bold text-indigo-400">{totalItems}</p>
            </div>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
              <p className="text-slate-400 text-sm">Data Fields</p>
              <p className="text-3xl font-bold text-cyan-400">{totalFields}</p>
            </div>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
              <p className="text-slate-400 text-sm">Total Value</p>
              <p className="text-3xl font-bold text-emerald-400">${totalValue.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        {items.length > 0 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="flex border-b border-slate-700">
              <button
                onClick={() => setActiveTab('data')}
                className={`px-6 py-3 font-semibold transition ${activeTab === 'data' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                📊 Data
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-6 py-3 font-semibold transition ${activeTab === 'raw' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                📄 Raw Text
              </button>
            </div>
            
            {activeTab === 'data' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-indigo-900/50 text-indigo-200">
                    <tr>
                      {Object.keys(items[0]).map((key) => (
                        <th key={key} className="px-4 py-3 text-left font-semibold">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-t border-slate-700 hover:bg-slate-700/50">
                        {Object.values(item).map((val, i) => (
                          <td key={i} className="px-4 py-2">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {activeTab === 'raw' && (
              <div className="p-4">
                <pre className="bg-slate-900 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap overflow-auto max-h-96">
                  {rawText}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}