'use client'

import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { adminAPI } from '@/lib/api'

interface Report {
  id: string
  name: string
  type: 'revenue' | 'orders' | 'users' | 'providers' | 'couriers' | 'disputes'
  description: string
  lastGenerated?: string
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly'
}

export default function ReportsPage() {
  const [reports] = useState<Report[]>([
    {
      id: 'rev',
      name: 'Revenue Report',
      type: 'revenue',
      description: 'Comprehensive revenue analysis including daily, weekly, and monthly breakdowns',
      lastGenerated: '2024-11-25 14:30',
      frequency: 'daily',
    },
    {
      id: 'ord',
      name: 'Orders Report',
      type: 'orders',
      description: 'Detailed order statistics, status distribution, and fulfillment metrics',
      lastGenerated: '2024-11-25 14:30',
      frequency: 'daily',
    },
    {
      id: 'usr',
      name: 'Users Report',
      type: 'users',
      description: 'User acquisition, growth trends, and engagement metrics',
      lastGenerated: '2024-11-24 10:00',
      frequency: 'weekly',
    },
    {
      id: 'prov',
      name: 'Providers Report',
      type: 'providers',
      description: 'Provider performance, verification status, and activity metrics',
      lastGenerated: '2024-11-24 10:00',
      frequency: 'weekly',
    },
    {
      id: 'cour',
      name: 'Couriers Report',
      type: 'couriers',
      description: 'Courier performance, delivery statistics, and ratings analysis',
      lastGenerated: '2024-11-24 10:00',
      frequency: 'weekly',
    },
    {
      id: 'dis',
      name: 'Disputes Report',
      type: 'disputes',
      description: 'Dispute summary, resolution status, and trend analysis',
      lastGenerated: '2024-11-23 08:00',
      frequency: 'monthly',
    },
  ])
  const [exporting, setExporting] = useState<string | null>(null)
  const [generatedReports, setGeneratedReports] = useState<
    Array<{
      id: string
      type: string
      format: string
      size: string
      generatedAt: string
    }>
  >([
    {
      id: '1',
      type: 'revenue',
      format: 'PDF',
      size: '2.4 MB',
      generatedAt: '2024-11-25 14:30',
    },
    {
      id: '2',
      type: 'revenue',
      format: 'CSV',
      size: '1.2 MB',
      generatedAt: '2024-11-25 14:30',
    },
    {
      id: '3',
      type: 'orders',
      format: 'PDF',
      size: '3.1 MB',
      generatedAt: '2024-11-25 12:00',
    },
    {
      id: '4',
      type: 'users',
      format: 'CSV',
      size: '0.8 MB',
      generatedAt: '2024-11-24 10:00',
    },
  ])

  const handleExportReport = async (type: string, format: 'csv' | 'pdf') => {
    try {
      setExporting(`${type}-${format}`)
      // TODO: Replace with actual API call
      // await adminAPI.exportData(type, format)

      // Simulate export
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Add to generated reports
      const newReport = {
        id: String(Math.random()),
        type,
        format: format.toUpperCase(),
        size: `${Math.random() * 5}.${Math.floor(Math.random() * 10)} MB`,
        generatedAt: new Date().toLocaleString(),
      }
      setGeneratedReports((prev) => [newReport, ...prev])

      alert(`${type} report exported as ${format.toUpperCase()} successfully!`)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export report')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and download platform reports</p>
      </div>

      {/* Available Reports */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <FileText className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{report.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{report.type.toUpperCase()} • {report.frequency}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{report.description}</p>

              {report.lastGenerated && (
                <p className="text-xs text-gray-500 mb-4">Last generated: {report.lastGenerated}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleExportReport(report.type, 'csv')}
                  disabled={exporting === `${report.type}-csv`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  <Download size={16} />
                  {exporting === `${report.type}-csv` ? 'Exporting...' : 'CSV'}
                </button>
                <button
                  onClick={() => handleExportReport(report.type, 'pdf')}
                  disabled={exporting === `${report.type}-pdf`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  <Download size={16} />
                  {exporting === `${report.type}-pdf` ? 'Exporting...' : 'PDF'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Generated Reports */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recently Generated Reports</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Report Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Format</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">File Size</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Generated</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {generatedReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                    No reports generated yet
                  </td>
                </tr>
              ) : (
                generatedReports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {report.format}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.size}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.generatedAt}</td>
                    <td className="px-6 py-4 text-sm">
                      <button className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Download size={16} />
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
