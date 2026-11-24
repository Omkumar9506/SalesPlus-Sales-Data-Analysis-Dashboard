import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Download,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { salesService } from '../services/api';

export default function DataManagerPage({ onDatasetUpdated, addToast }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      addToast({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Only standard comma-separated (.csv) files are supported.',
      });
      return;
    }
    setFile(selectedFile);
    setUploadResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const confirmUpload = async () => {
    if (!file) return;
    setIsConfirmModalOpen(false);
    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await salesService.uploadCSV(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      if (response.success) {
        setUploadResult(response.data);
        setFile(null);
        addToast({
          type: 'success',
          title: 'Dataset Upload Successful',
          message: `Successfully imported ${response.data.imported_rows} records. Analytics refreshed!`,
        });
        if (onDatasetUpdated) onDatasetUpdated();
      } else {
        addToast({
          type: 'error',
          title: 'Upload Failed',
          message: response.error || 'Failed to process CSV file.',
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Upload Error',
        message: err.response?.data?.error || 'Server error occurred during CSV parsing.',
      });
    } finally {
      setUploading(false);
    }
  };

  const confirmReset = async () => {
    setResetting(true);
    try {
      const response = await salesService.resetDataset();
      if (response.success) {
        setIsResetModalOpen(false);
        setUploadResult(null);
        addToast({
          type: 'success',
          title: 'Dataset Restored',
          message: 'Restored default realistic 18-month baseline dataset.',
        });
        if (onDatasetUpdated) onDatasetUpdated();
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Reset Failed',
        message: 'Could not restore default dataset.',
      });
    } finally {
      setResetting(false);
    }
  };

  // Generate downloadable sample CSV template
  const downloadSampleTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'date,product,category,quantity,price\n' +
      '2025-01-05,Wireless Noise-Canceling Headphones,Electronics,2,149.99\n' +
      '2025-01-08,Classic Denim Jacket,Fashion,1,68.50\n' +
      '2025-01-12,Ceremonial Grade Matcha Powder 100g,Grocery,3,18.99\n' +
      '2025-01-15,Ergonomic Lumbar Office Chair,Home,1,249.00\n' +
      '2025-01-18,Hardcover Dotted Grid Journal A5,Stationery,4,15.50\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sales_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Upload Zone Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Upload Custom Sales CSV</h2>
            <p className="text-xs text-slate-500 font-medium">
              Import transaction data to instantly power all dashboard KPIs, charts, and ML forecasting models.
            </p>
          </div>
          <button
            onClick={downloadSampleTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Sample CSV Template</span>
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
              : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files[0])}
            accept=".csv"
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 border border-indigo-100 shadow-xs">
            <Upload className="w-7 h-7" />
          </div>

          <h3 className="text-sm font-bold text-slate-900">
            {file ? file.name : 'Click to upload or drag and drop your sales CSV'}
          </h3>

          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {file
              ? `${(file.size / 1024).toFixed(1)} KB • Ready for verification & import`
              : 'Supports standard CSV format with headers date, product, category, quantity, price'}
          </p>
        </div>

        {/* File Actions */}
        {file && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">{file.name}</p>
                <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFile(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={uploading}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-sm shadow-indigo-100 transition-all flex items-center gap-1.5"
              >
                {uploading ? 'Processing...' : 'Verify & Import Dataset'}
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Uploading & Parsing Data...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Success Report */}
        {uploadResult && (
          <div className="mt-6 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-sm mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Dataset Successfully Ingested & Analytics Synchronized
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-emerald-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Imported Rows</span>
                <span className="font-extrabold text-slate-900 text-base">
                  {formatNumber(uploadResult.imported_rows)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Rejected Rows</span>
                <span className="font-extrabold text-slate-900 text-base">
                  {formatNumber(uploadResult.rejected_rows)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Sales Ingested</span>
                <span className="font-extrabold text-slate-900 text-base">
                  {formatCurrency(uploadResult.total_revenue)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Timespan</span>
                <span className="font-semibold text-slate-900 text-xs block truncate mt-1">
                  {uploadResult.date_range?.start} to {uploadResult.date_range?.end}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSV Schema Specification */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          Required CSV Column Schema & Validation Rules
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          The ingestion engine strictly validates headers and coerces datatypes before passing records into Pandas and Scikit-learn.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-2.5">Column Name</th>
                <th className="pb-2.5">Data Type</th>
                <th className="pb-2.5">Required</th>
                <th className="pb-2.5">Example</th>
                <th className="pb-2.5">Validation Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 font-bold text-indigo-600">date</td>
                <td className="py-2.5 text-slate-600">Date / String</td>
                <td className="py-2.5 font-bold text-emerald-600">Yes</td>
                <td className="py-2.5 text-slate-800">2025-03-15</td>
                <td className="py-2.5 text-slate-500">ISO format (YYYY-MM-DD or MM/DD/YYYY)</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-indigo-600">product</td>
                <td className="py-2.5 text-slate-600">Text / String</td>
                <td className="py-2.5 font-bold text-emerald-600">Yes</td>
                <td className="py-2.5 text-slate-800">Ultra HD Gaming Monitor</td>
                <td className="py-2.5 text-slate-500">Non-empty item name</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-indigo-600">category</td>
                <td className="py-2.5 text-slate-600">Text / String</td>
                <td className="py-2.5 font-bold text-emerald-600">Yes</td>
                <td className="py-2.5 text-slate-800">Electronics</td>
                <td className="py-2.5 text-slate-500">Product line category</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-indigo-600">quantity</td>
                <td className="py-2.5 text-slate-600">Integer</td>
                <td className="py-2.5 font-bold text-emerald-600">Yes</td>
                <td className="py-2.5 text-slate-800">2</td>
                <td className="py-2.5 text-slate-500">Positive whole number &gt; 0</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-indigo-600">price</td>
                <td className="py-2.5 text-slate-600">Float / Decimal</td>
                <td className="py-2.5 font-bold text-emerald-600">Yes</td>
                <td className="py-2.5 text-slate-800">149.99</td>
                <td className="py-2.5 text-slate-500">Non-negative unit price ($)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Dataset Reset & Restore Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Restore Default Realistic Dataset</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Reset to the curated 18-month baseline dataset containing 4,400+ transactions across 5 categories.
          </p>
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Restore Default Dataset</span>
        </button>
      </div>

      {/* Confirmation Modal for Overwriting Dataset */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmUpload}
        title="Confirm Dataset Replacement"
        message={`Are you sure you want to import "${file?.name}"? This will replace the active sales dataset and recalculate all executive metrics, product statistics, and machine learning models.`}
        confirmText="Confirm & Overwrite"
        isDanger={false}
      />

      {/* Confirmation Modal for Resetting Dataset */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={confirmReset}
        title="Restore Default Dataset"
        message="This action will replace the currently loaded dataset with the baseline sample dataset (18 months, 4,400+ orders). Any unsaved uploaded records will be replaced."
        confirmText="Restore Baseline"
        isDanger={true}
        loading={resetting}
      />
    </div>
  );
}
