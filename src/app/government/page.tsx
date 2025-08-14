"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DispatchRecord, EmergencyCall } from "@/lib/types";

export default function GovernmentDashboard() {
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [calls, setCalls] = useState<EmergencyCall[]>([]);

  useEffect(() => {
    fetch("/api/dispatch").then(r => r.json()).then(setDispatches);
    fetch("/api/calls").then(r => r.json()).then(setCalls);
  }, []);

  // Mock regional data for Ghana
  const regionalData = [
    { region: "Greater Accra", population: 5455692, ambulances: 45, avgResponse: 7.2, coverage: 94 },
    { region: "Ashanti", population: 5440463, ambulances: 38, avgResponse: 8.1, coverage: 87 },
    { region: "Western", population: 2060585, ambulances: 22, avgResponse: 9.3, coverage: 82 },
    { region: "Eastern", population: 2106696, ambulances: 25, avgResponse: 8.7, coverage: 85 },
    { region: "Central", population: 2859821, ambulances: 28, avgResponse: 8.9, coverage: 83 },
    { region: "Northern", population: 2479461, ambulances: 20, avgResponse: 11.2, coverage: 76 },
    { region: "Volta", population: 2118252, ambulances: 18, avgResponse: 10.1, coverage: 79 },
    { region: "Upper East", population: 1301134, ambulances: 12, avgResponse: 12.5, coverage: 71 },
    { region: "Upper West", population: 746539, ambulances: 8, avgResponse: 13.1, coverage: 68 },
    { region: "Brong Ahafo", population: 2310983, ambulances: 24, avgResponse: 9.8, coverage: 81 }
  ];

  const budgetData = [
    { year: "2022", traditional: 45.2, withAADS: 32.1, savings: 13.1 },
    { year: "2023", traditional: 48.7, withAADS: 33.8, savings: 14.9 },
    { year: "2024", traditional: 52.3, withAADS: 35.2, savings: 17.1 },
    { year: "2025", traditional: 56.1, withAADS: 36.9, savings: 19.2 },
    { year: "2026", traditional: 60.2, withAADS: 38.4, savings: 21.8 }
  ];

  const healthOutcomes = [
    { metric: "Cardiac Arrest Survival", before: 12, after: 28, improvement: 133 },
    { metric: "Stroke Response", before: 45, after: 67, improvement: 49 },
    { metric: "Trauma Outcomes", before: 78, after: 89, improvement: 14 },
    { metric: "Maternal Emergency", before: 82, after: 94, improvement: 15 }
  ];

  const totalPopulation = regionalData.reduce((sum, r) => sum + r.population, 0);
  const totalAmbulances = regionalData.reduce((sum, r) => sum + r.ambulances, 0);
  const avgCoverage = regionalData.reduce((sum, r) => sum + r.coverage, 0) / regionalData.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-white font-bold text-xl">GH</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Ghana Emergency Medical Services
              </h1>
              <p className="text-gray-600">National Healthcare Infrastructure Dashboard</p>
            </div>
          </div>
        </div>

        {/* National Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-green-600">{(totalPopulation / 1000000).toFixed(1)}M</div>
            <div className="text-sm text-gray-600">Population Served</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalAmbulances}</div>
            <div className="text-sm text-gray-600">Active Ambulances</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-purple-600">{avgCoverage.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Average Coverage</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-red-600">GHS 2.8M</div>
            <div className="text-sm text-gray-600">Monthly Savings</div>
          </div>
        </div>

        {/* Regional Performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Regional Performance Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Region</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Population</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Ambulances</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Avg Response</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Coverage</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {regionalData.map(region => (
                  <tr key={region.region} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">{region.region}</td>
                    <td className="py-3 px-4">{(region.population / 1000000).toFixed(1)}M</td>
                    <td className="py-3 px-4">{region.ambulances}</td>
                    <td className="py-3 px-4">{region.avgResponse}min</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${region.coverage}%` }}
                          ></div>
                        </div>
                        {region.coverage}%
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        region.coverage >= 90 ? 'bg-green-100 text-green-700' :
                        region.coverage >= 80 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {region.coverage >= 90 ? 'Excellent' : region.coverage >= 80 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">5-Year Budget Projection (GHS Millions)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="traditional" fill="#ef4444" name="Traditional System" />
                <Bar dataKey="withAADS" fill="#22c55e" name="With AADS" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Outcome Improvements (%)</h3>
            <div className="space-y-4">
              {healthOutcomes.map(outcome => (
                <div key={outcome.metric}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{outcome.metric}</span>
                    <span className="text-sm text-green-600">+{outcome.improvement}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${(outcome.after / 100) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Before: {outcome.before}%</span>
                    <span>After: {outcome.after}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Policy Recommendations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Policy Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Immediate Actions (0-6 months)</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Deploy AADS in Greater Accra and Ashanti regions first
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Train 200+ emergency dispatchers on new system
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Establish data sharing protocols with hospitals
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Implement GPS tracking on all ambulances
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Long-term Strategy (6-24 months)</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Nationwide rollout to all 10 regions
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Integration with National Health Insurance Scheme
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Establish regional emergency response centers
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Develop local technology partnerships
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Investment Summary */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-xl font-semibold mb-6">Investment Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">GHS 45M</div>
              <div className="text-green-100">Initial Investment</div>
              <div className="text-sm text-green-200">3-year implementation</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">GHS 156M</div>
              <div className="text-green-100">Total Savings</div>
              <div className="text-sm text-green-200">Over 5 years</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">347%</div>
              <div className="text-green-100">Return on Investment</div>
              <div className="text-sm text-green-200">5-year ROI</div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <div className="text-lg font-medium">Estimated Lives Saved Annually: 2,400+</div>
            <div className="text-green-200 text-sm">Based on 15% improvement in emergency response times</div>
          </div>
        </div>
      </div>
    </div>
  );
}
