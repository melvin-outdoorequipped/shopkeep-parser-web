import { useState, useRef, useEffect } from 'react';
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

const getBackendUrl = (endpoint: string = '/api/parse') => {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!base) {
    throw new Error('Missing NEXT_PUBLIC_BACKEND_URL in .env.local');
  }
  return `${base}${endpoint}`;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [rawText, setRawText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'data' | 'raw'>('data');
  const [totalValue, setTotalValue] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const testConnection = async () => {
    try {
      const res = await axios.get(getBackendUrl('/api/health'), { timeout: 5000 });
      setError('');
      setSuccess(`✅ Backend reachable! Model: ${res.data.model}`);
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError('❌ Cannot reach backend – check if backend is running on port 8080');
      } else if (err.response) {
        setError(`❌ Server error: ${err.response.status} - ${err.response.data?.error || ''}`);
      } else {
        setError(`❌ ${err.message}`);
      }
      setSuccess('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(getBackendUrl('/api/parse'), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      const parsedItems = res.data.items || [];
      setItems(parsedItems);
      setRawText(res.data.raw_text || '');
      setActiveTab('data');
      setSuccess(`✅ Parsed ${parsedItems.length} items successfully!`);
      
      // Calculate total value (if wholesale_price exists)
      let total = 0;
      parsedItems.forEach((item: any) => {
        const price = parseFloat(item.wholesale_price);
        const qty = parseInt(item.quantity);
        if (!isNaN(price) && !isNaN(qty)) total += price * qty;
      });
      setTotalValue(total);
    } catch (err: any) {
      const backendMsg = err.response?.data?.error;
      setError(`Parse failed: ${backendMsg || err.message || 'Unknown error'}`);
      setSuccess('');
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
    setSuccess('✅ Exported to Excel');
    setTimeout(() => setSuccess(''), 3000);
  };

  const clearData = () => {
    setItems([]);
    setRawText('');
    setTotalValue(0);
    setActiveTab('data');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-darkBg">
      {/* Header */}
      <header className="bg-cardBg border-b border-border px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">⚡ SHOPKEEP</span>
          <span className="text-2xl font-bold text-textPrimary">PARSER</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            error ? 'bg-danger/20 text-danger' : success ? 'bg-success/20 text-success' : 'bg-accent/20 text-accent'
          }`}>
            {error ? '⚠️ Error' : success ? '✓ Ready' : '● Online'}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-80 bg-cardBg border-r border-border p-6 flex flex-col gap-6 min-h-[calc(100vh-73px)]">
          <div>
            <h2 className="text-lg font-bold text-textPrimary mb-1">📊 Control Panel</h2>
            <p className="text-xs text-textSecondary">Listing Operations</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-primary hover:bg-primaryDark text-white font-semibold py-3 rounded-xl transition"
            >
              📤 Upload Document
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`w-full py-3 rounded-xl font-semibold transition ${
                !file || loading
                  ? 'bg-secondary/50 cursor-not-allowed'
                  : 'bg-secondary hover:bg-purple-700'
              } text-white`}
            >
              {loading ? '⏳ Processing...' : '🚀 Process Document'}
            </button>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-textSecondary mb-2">💾 Export Options</h3>
            <div className="space-y-2">
              <button
                onClick={exportToExcel}
                disabled={items.length === 0}
                className={`w-full py-2 rounded-lg text-sm font-medium transition ${
                  items.length === 0
                    ? 'bg-success/30 cursor-not-allowed'
                    : 'bg-success hover:bg-green-700'
                } text-white`}
              >
                📥 Export to Excel
              </button>
              <button
                onClick={clearData}
                className="w-full py-2 rounded-lg text-sm font-medium bg-cardHover hover:bg-border text-textPrimary transition"
              >
                🗑 Clear Data
              </button>
            </div>
          </div>

          <div className="mt-auto pt-4 text-center text-xs text-textSecondary">
            v3.0 • Coordinate-Based
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* File Info Card */}
          <div className="bg-cardBg rounded-2xl border border-border p-5 mb-6">
            <h3 className="text-xl font-bold text-textPrimary">
              📄 {file ? file.name : 'No document loaded'}
            </h3>
            <p className="text-textSecondary text-sm mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB • ${file.type}` : 'Upload a PDF or image to get started'}
            </p>
          </div>

          {/* Stats Cards */}
          {items.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-cardBg rounded-2xl border border-border p-4">
                <p className="text-textSecondary text-sm">Total Items</p>
                <p className="text-3xl font-bold text-primary">{items.length}</p>
              </div>
              <div className="bg-cardBg rounded-2xl border border-border p-4">
                <p className="text-textSecondary text-sm">Data Fields</p>
                <p className="text-3xl font-bold text-accent">{items[0] ? Object.keys(items[0]).length : 0}</p>
              </div>
              <div className="bg-cardBg rounded-2xl border border-border p-4">
                <p className="text-textSecondary text-sm">Total Value</p>
                <p className="text-3xl font-bold text-success">${totalValue.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Error / Success Messages */}
          {error && (
            <div className="bg-danger/20 border border-danger/50 text-danger p-3 rounded-xl mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-success/20 border border-success/50 text-success p-3 rounded-xl mb-4">
              {success}
            </div>
          )}

          {/* Tabs and Data Display */}
          {items.length > 0 && (
            <div className="bg-cardBg rounded-2xl border border-border overflow-hidden">
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab('data')}
                  className={`px-6 py-3 font-medium transition ${
                    activeTab === 'data'
                      ? 'bg-primary text-white'
                      : 'text-textSecondary hover:bg-cardHover'
                  }`}
                >
                  📊 Data Table
                </button>
                <button
                  onClick={() => setActiveTab('raw')}
                  className={`px-6 py-3 font-medium transition ${
                    activeTab === 'raw'
                      ? 'bg-primary text-white'
                      : 'text-textSecondary hover:bg-cardHover'
                  }`}
                >
                  📄 Raw Extracted Text
                </button>
              </div>

              <div className="p-4">
                {activeTab === 'data' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {items[0] && Object.keys(items[0]).map((key) => (
                            <th key={key} className="text-left py-2 px-3 font-semibold text-textSecondary">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx} className="border-b border-border/50 hover:bg-cardHover/50">
                            {Object.values(item).map((val, j) => (
                              <td key={j} className="py-2 px-3 text-textPrimary">
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <pre className="bg-darkBg p-4 rounded-lg overflow-auto text-xs text-textSecondary font-mono whitespace-pre-wrap">
                    {rawText}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="fixed bottom-6 right-6 bg-cardBg rounded-full shadow-lg px-4 py-2 flex items-center gap-2 border border-primary">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-textPrimary">Processing...</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}