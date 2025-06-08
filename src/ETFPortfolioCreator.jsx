import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Papa from 'papaparse';
import { Upload, Star, Filter, TrendingUp, DollarSign, Package, Building, BarChart3, Plus, Minus, Check, X, AlertCircle, Database, RefreshCw, Download } from 'lucide-react';

const ETFPortfolioCreator = () => {
  const [uploadedData, setUploadedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState('custom');
  const [allocations, setAllocations] = useState({
    bonds: 0,
    equity: 0,
    commodities: 0,
    real_estate: 0
  });
  const [filters, setFilters] = useState({
    bonds: {
      distribution: 'all',
      replication: 'all',
      currency: 'all',
      sortBy: 'aum'
    },
    equity: {
      distribution: 'all',
      replication: 'all',
      currency: 'all',
      sortBy: 'aum'
    },
    commodities: {
      distribution: 'all',
      replication: 'all',
      currency: 'all',
      sortBy: 'aum'
    },
    real_estate: {
      distribution: 'all',
      replication: 'all',
      currency: 'all',
      sortBy: 'aum'
    }
  });
  const [selectedETFs, setSelectedETFs] = useState({
    bonds: {},
    equity: {},
    commodities: {},
    real_estate: {}
  });
  const [starredETFs, setStarredETFs] = useState(new Set());

  const [showExportView, setShowExportView] = useState(false);

  const macroCategories = {
    bonds: { 
      name: 'Obbligazionari', 
      color: '#2563EB',
      colorLight: '#3B82F6',
      colorDark: '#1E40AF',
      bgGradient: 'from-blue-900/20 to-blue-800/20',
      borderColor: 'border-blue-600',
      icon: '📈' 
    },
    equity: { 
      name: 'Azionari', 
      color: '#DC2626',
      colorLight: '#EF4444',
      colorDark: '#B91C1C',
      bgGradient: 'from-red-900/20 to-red-800/20',
      borderColor: 'border-red-600',
      icon: '📊' 
    },
    commodities: { 
      name: 'Materie Prime', 
      color: '#D97706',
      colorLight: '#F59E0B',
      colorDark: '#B45309',
      bgGradient: 'from-amber-900/20 to-amber-800/20',
      borderColor: 'border-amber-600',
      icon: '🏭' 
    },
    real_estate: { 
      name: 'Immobiliare', 
      color: '#059669',
      colorLight: '#10B981',
      colorDark: '#047857',
      bgGradient: 'from-emerald-900/20 to-emerald-800/20',
      borderColor: 'border-emerald-600',
      icon: '🏢' 
    }
  };

  // Helper function per ottenere il valore AuM con diversi possibili nomi di campo
  const getAuMValue = (etf) => {
    if (!etf) return null;
    
    // Lista di tutti i possibili nomi del campo AuM
    const possibleFields = [
      'AuM (Mln EUR)',
      'AuM (Mln EUR)', // Con spazi diversi
      'AuM(Mln EUR)',  // Senza spazio
      'AUM (MLN EUR)',
      'AuM',
      'AUM',
      'Assets under Management',
      'AuM (Mln €)',
      'AuM Mln EUR',
      'AuM Mln €',
      'aum',
      'Aum'
    ];
    
    // Prima prova match esatto
    for (const field of possibleFields) {
      if (etf.hasOwnProperty(field) && etf[field] !== undefined && etf[field] !== null && etf[field] !== '') {
        return etf[field];
      }
    }
    
    // Se non trova, cerca nei campi con partial match
    const etfKeys = Object.keys(etf);
    for (const key of etfKeys) {
      if (key.toLowerCase().includes('aum') && etf[key] !== undefined && etf[key] !== null && etf[key] !== '') {
        return etf[key];
      }
    }
    
    return null;
  };

  const categorizeETF = (etf) => {
    const category = etf['Categoria']?.toLowerCase() || '';
    const morningstar = etf['Categoria Morningstar']?.toLowerCase() || '';
    
    if (category.includes('obbl') || category.includes('bond') || morningstar.includes('bond')) {
      return 'bonds';
    } else if (category.includes('azion') || category.includes('equity') || morningstar.includes('equity')) {
      return 'equity';
    } else if (category.includes('mater') || category.includes('commod') || morningstar.includes('commodity')) {
      return 'commodities';
    } else if (category.includes('immobil') || category.includes('real estate') || morningstar.includes('property')) {
      return 'real_estate';
    }
    return 'equity';
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      // Inizia il caricamento
      setIsLoading(true);
      
      // Salva il nome del file
      setFileName(file.name);
      
      // Reset tutti i dati quando si carica un nuovo file
      setSelectedETFs({
        bonds: {},
        equity: {},
        commodities: {},
        real_estate: {}
      });
      setAllocations({
        bonds: 0,
        equity: 0,
        commodities: 0,
        real_estate: 0
      });
      setStarredETFs(new Set());
      setFilters({
        bonds: {
          distribution: 'all',
          replication: 'all',
          currency: 'all',
          sortBy: 'aum'
        },
        equity: {
          distribution: 'all',
          replication: 'all',
          currency: 'all',
          sortBy: 'aum'
        },
        commodities: {
          distribution: 'all',
          replication: 'all',
          currency: 'all',
          sortBy: 'aum'
        },
        real_estate: {
          distribution: 'all',
          replication: 'all',
          currency: 'all',
          sortBy: 'aum'
        }
      });
      
      Papa.parse(file, {
        complete: (results) => {
          const data = results.data.filter(row => row.Nome && row.ISIN);
          
          // Debug: log delle colonne disponibili
          if (data.length > 0) {
            console.log('Colonne disponibili nel CSV:', Object.keys(data[0]));
            console.log('Esempio primo ETF:', data[0]);
            
            // Debug specifico per AuM
            const firstETF = data[0];
            console.log('--- DEBUG AuM ---');
            console.log('IMPORTANTE: Se AuM non appare, verifica il nome esatto della colonna nel CSV');
            console.log('');
            console.log('Tutti i campi del primo ETF:');
            Object.keys(firstETF).forEach(key => {
              console.log(`  "${key}": "${firstETF[key]}" (tipo: ${typeof firstETF[key]})`);
            });
            
            // Cerca specificamente campi AuM
            console.log('\nCampi che potrebbero contenere AuM:');
            Object.keys(firstETF).forEach(key => {
              if (key.toLowerCase().includes('aum') || 
                  key.toLowerCase().includes('mln') || 
                  key.toLowerCase().includes('assets')) {
                console.log(`  ✓ Trovato: "${key}" = "${firstETF[key]}"`);
              }
            });
          }
          
          const categorizedData = data.map(etf => {
            // Pulisci tutti i valori rimuovendo spazi extra
            const cleanedETF = {};
            Object.keys(etf).forEach(key => {
              cleanedETF[key] = typeof etf[key] === 'string' ? etf[key].trim() : etf[key];
            });
            
            return {
              ...cleanedETF,
              macroCategory: categorizeETF(cleanedETF),
              id: cleanedETF.ISIN || Math.random().toString(36).substr(2, 9) // Fallback ID se ISIN manca
            };
          });
          setUploadedData(categorizedData);
          setIsLoading(false);
        },
        header: true,
        dynamicTyping: false, // Disabilitiamo per controllare meglio i tipi
        skipEmptyLines: true,
        delimitersToGuess: [',', ';', '\t', '|'],
        transformHeader: (header) => {
          // Rimuovi spazi, caratteri invisibili e normalizza
          return header.trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '');
        }
      });
    }
    // Reset l'input per permettere di ricaricare lo stesso file
    event.target.value = '';
  };

  const getFilteredDataByCategory = (data, category) => {
    const categoryFilters = filters[category];
    return data.filter(etf => {
      if (categoryFilters.distribution !== 'all') {
        if (!etf.Distribuzione) return false;
        const dist = etf.Distribuzione;
        if (categoryFilters.distribution === 'Acc' && dist !== 'Acc' && dist !== 'Accumulazione') return false;
        if (categoryFilters.distribution === 'Dist' && dist !== 'Dist' && dist !== 'Distribuzione') return false;
      }
      if (categoryFilters.replication !== 'all') {
        if (!etf.Replica || etf.Replica !== categoryFilters.replication) return false;
      }
      if (categoryFilters.currency !== 'all') {
        if (!etf.Valuta || etf.Valuta !== categoryFilters.currency) return false;
      }
      return true;
    });
  };

  const getSortedDataByCategory = (data, category) => {
    const sorted = [...data];
    const sortBy = filters[category].sortBy;
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'aum':
          // Cerca il valore AuM in entrambi gli ETF
          let aumA = null, aumB = null;
          
          // Cerca in tutti i campi
          for (const [key, value] of Object.entries(a)) {
            if (key.includes('AuM') || key.includes('AUM') || key.includes('aum')) {
              aumA = parseFloat(String(value).replace(',', '.')) || 0;
              break;
            }
          }
          
          for (const [key, value] of Object.entries(b)) {
            if (key.includes('AuM') || key.includes('AUM') || key.includes('aum')) {
              aumB = parseFloat(String(value).replace(',', '.')) || 0;
              break;
            }
          }
          
          return (aumB || 0) - (aumA || 0);
        case 'ter':
          const terA = parseFloat(String(a.TER).replace(',', '.')) || 0;
          const terB = parseFloat(String(b.TER).replace(',', '.')) || 0;
          return terA - terB;
        case 'name':
          return a.Nome.localeCompare(b.Nome);
        default:
          return 0;
      }
    });
    return sorted;
  };

  const groupedData = useMemo(() => {
    const grouped = {
      bonds: [],
      equity: [],
      commodities: [],
      real_estate: []
    };
    
    if (!uploadedData || uploadedData.length === 0) {
      return grouped;
    }
    
    uploadedData.forEach(etf => {
      const category = etf.macroCategory;
      if (grouped[category]) {
        grouped[category].push(etf);
      }
    });
    
    // Applica filtri e ordinamento per ogni categoria
    Object.keys(grouped).forEach(category => {
      const filtered = getFilteredDataByCategory(grouped[category], category);
      grouped[category] = getSortedDataByCategory(filtered, category);
    });
    
    return grouped;
  }, [uploadedData, filters]);

  const totalAllocation = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const allocationStatus = totalAllocation === 100 ? 'perfect' : totalAllocation < 100 ? 'under' : 'over';

  const pieData = Object.entries(allocations).map(([key, value]) => ({
    name: macroCategories[key].name,
    value: value,
    color: macroCategories[key].color
  })).filter(item => item.value > 0);
  
  if (totalAllocation < 100) {
    pieData.push({
      name: 'Non allocato',
      value: 100 - totalAllocation,
      color: '#1F2937'
    });
  }

  const handleAllocationChange = (category, value) => {
    const newValue = Math.max(0, Math.min(100, value));
    
    if (newValue === 0 && allocations[category] > 0) {
      setSelectedETFs(prev => ({
        ...prev,
        [category]: {}
      }));
    }
    
    setAllocations(prev => ({
      ...prev,
      [category]: newValue
    }));
  };

  const toggleETFSelection = (category, etfId) => {
    setSelectedETFs(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [etfId]: prev[category][etfId] ? undefined : { weight: 0 }
      }
    }));
  };

  const updateETFWeight = (category, etfId, weight) => {
    setSelectedETFs(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [etfId]: { weight: Math.max(0, Math.min(100, weight)) }
      }
    }));
  };

  const getCategoryWeight = (category) => {
    const etfs = selectedETFs[category];
    return Object.values(etfs).reduce((sum, etf) => sum + (etf?.weight || 0), 0);
  };

  const toggleStar = (etfId) => {
    setStarredETFs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(etfId)) {
        newSet.delete(etfId);
      } else {
        newSet.add(etfId);
      }
      return newSet;
    });
  };

  const calculateWeightedTER = () => {
    let totalWeight = 0;
    let weightedTER = 0;

    Object.entries(selectedETFs).forEach(([category, etfs]) => {
      if (allocations[category] >= 1) {
        const categoryAllocation = allocations[category] / 100;
        Object.entries(etfs).forEach(([etfId, etfData]) => {
          if (etfData && etfData.weight > 0) {
            const etf = uploadedData?.find(e => e.id === etfId);
            if (etf) {
              const effectiveWeight = (etfData.weight / 100) * categoryAllocation;
              const ter = parseFloat(String(etf.TER).replace(',', '.')) || 0;
              totalWeight += effectiveWeight;
              weightedTER += effectiveWeight * ter;
            }
          }
        });
      }
    });

    return totalWeight > 0 ? (weightedTER / totalWeight).toFixed(4) : '0.0000';
  };

  const getSelectedETFsCount = () => {
    let count = 0;
    Object.entries(selectedETFs).forEach(([category, etfs]) => {
      if (allocations[category] >= 1) {
        count += Object.keys(etfs).length;
      }
    });
    return count;
  };

  const getPortfolioCoverage = () => {
    let coverage = 0;
    Object.entries(allocations).forEach(([category, allocation]) => {
      if (allocation >= 1) {
        const categoryWeight = getCategoryWeight(category);
        if (categoryWeight === 100) {
          coverage += allocation;
        }
      }
    });
    return coverage;
  };

  // Controlla se il portafoglio è completo
  const isPortfolioComplete = () => {
    // Il portafoglio è completo quando:
    // 1. La copertura totale è 100% (tutte le categorie allocate hanno ETF che sommano al 100%)
    // 2. Ci sono ETF selezionati
    // 3. L'allocazione totale è 100%
    return getPortfolioCoverage() === 100 && 
           getSelectedETFsCount() > 0 && 
           totalAllocation === 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      {/* Export View */}
      {showExportView ? (
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-800 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Export Portafoglio</h2>
              <button 
                onClick={() => setShowExportView(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            
            {/* Grafico a torta dettagliato */}
            <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-700">
              <h3 className="text-xl font-semibold mb-6 text-blue-400">📊 Allocazione Portafoglio Dettagliata</h3>
              
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const detailedData = [];
                        
                        // Definisci le gradazioni di colore per categoria
                        const colorGradients = {
                          bonds: ['#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93BBFC'],
                          equity: ['#7F1D1D', '#B91C1C', '#DC2626', '#EF4444', '#F87171'],
                          commodities: ['#78350F', '#B45309', '#D97706', '#F59E0B', '#FCD34D'],
                          real_estate: ['#064E3B', '#047857', '#059669', '#10B981', '#34D399']
                        };
                        
                        Object.entries(selectedETFs).forEach(([category, etfs]) => {
                          if (allocations[category] >= 1) {
                            const categoryAllocation = allocations[category] / 100;
                            const colors = colorGradients[category];
                            let etfColorIndex = 0;
                            
                            Object.entries(etfs).forEach(([etfId, etfData]) => {
                              if (etfData && etfData.weight > 0) {
                                const etf = uploadedData?.find(e => e.id === etfId);
                                if (etf) {
                                  const effectiveWeight = (etfData.weight / 100) * categoryAllocation * 100;
                                  detailedData.push({
                                    name: etf.Nome,
                                    value: effectiveWeight,
                                    color: colors[etfColorIndex % colors.length],
                                    category: macroCategories[category].name,
                                    categoryKey: category
                                  });
                                  etfColorIndex++;
                                }
                              }
                            });
                          }
                        });
                        
                        return detailedData;
                      })()}
                      cx="50%"
                      cy="50%"
                      innerRadius={100}
                      outerRadius={180}
                      paddingAngle={1}
                      dataKey="value"
                    >
                      {(() => {
                        const detailedData = [];
                        const colorGradients = {
                          bonds: ['#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93BBFC'],
                          equity: ['#7F1D1D', '#B91C1C', '#DC2626', '#EF4444', '#F87171'],
                          commodities: ['#78350F', '#B45309', '#D97706', '#F59E0B', '#FCD34D'],
                          real_estate: ['#064E3B', '#047857', '#059669', '#10B981', '#34D399']
                        };
                        
                        Object.entries(selectedETFs).forEach(([category, etfs]) => {
                          if (allocations[category] >= 1) {
                            const categoryAllocation = allocations[category] / 100;
                            const colors = colorGradients[category];
                            let etfColorIndex = 0;
                            
                            Object.entries(etfs).forEach(([etfId, etfData]) => {
                              if (etfData && etfData.weight > 0) {
                                const etf = uploadedData?.find(e => e.id === etfId);
                                if (etf) {
                                  detailedData.push({
                                    color: colors[etfColorIndex % colors.length]
                                  });
                                  etfColorIndex++;
                                }
                              }
                            });
                          }
                        });
                        
                        return detailedData.map((item, index) => (
                          <Cell key={`cell-${index}`} fill={item.color} />
                        ));
                      })()}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        color: '#1F2937',
                        border: '1px solid #E5E7EB', 
                        borderRadius: '8px',
                        fontWeight: '600',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                      formatter={(value, name, props) => {
                        return [`${value.toFixed(2)}%`, props.payload.name];
                      }}
                      labelFormatter={(label) => ''}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legenda organizzata per categoria */}
              <div className="grid grid-cols-2 gap-6 mt-8">
                {Object.entries(macroCategories).map(([categoryKey, category]) => {
                  if (allocations[categoryKey] < 1) return null;
                  
                  const categoryETFs = [];
                  const colorGradients = {
                    bonds: ['#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93BBFC'],
                    equity: ['#7F1D1D', '#B91C1C', '#DC2626', '#EF4444', '#F87171'],
                    commodities: ['#78350F', '#B45309', '#D97706', '#F59E0B', '#FCD34D'],
                    real_estate: ['#064E3B', '#047857', '#059669', '#10B981', '#34D399']
                  };
                  const colors = colorGradients[categoryKey];
                  
                  Object.entries(selectedETFs[categoryKey]).forEach(([etfId, etfData], index) => {
                    if (etfData && etfData.weight > 0) {
                      const etf = uploadedData?.find(e => e.id === etfId);
                      if (etf) {
                        const effectiveWeight = (etfData.weight / 100) * allocations[categoryKey];
                        categoryETFs.push({
                          name: etf.Nome,
                          weight: effectiveWeight,
                          color: colors[index % colors.length]
                        });
                      }
                    }
                  });
                  
                  if (categoryETFs.length === 0) return null;
                  
                  return (
                    <div key={categoryKey} className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <span className="text-xl">{category.icon}</span>
                        <span style={{ color: category.colorLight }}>{category.name}</span>
                        <span className="text-gray-400">({allocations[categoryKey]}%)</span>
                      </h4>
                      <div className="space-y-2">
                        {categoryETFs.map((etf, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: etf.color }}></div>
                            <span className="flex-1 truncate">{etf.name}</span>
                            <span className="font-semibold">{etf.weight.toFixed(2)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Tabella riassuntiva */}
            <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-700">
              <h3 className="text-xl font-semibold mb-6 text-green-400">📋 Dettaglio Componenti Portafoglio</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">Categoria</th>
                      <th className="text-left py-3 px-4">Nome ETF</th>
                      <th className="text-left py-3 px-4">ISIN</th>
                      <th className="text-left py-3 px-4">Ticker</th>
                      <th className="text-right py-3 px-4">TER</th>
                      <th className="text-right py-3 px-4">% Portafoglio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(macroCategories).map(([categoryKey, category]) => {
                      if (allocations[categoryKey] < 1) return null;
                      
                      const rows = [];
                      Object.entries(selectedETFs[categoryKey]).forEach(([etfId, etfData]) => {
                        if (etfData && etfData.weight > 0) {
                          const etf = uploadedData?.find(e => e.id === etfId);
                          if (etf) {
                            const effectiveWeight = (etfData.weight / 100) * allocations[categoryKey];
                            rows.push(
                              <tr key={etfId} className="border-b border-gray-800 hover:bg-gray-800/50">
                                <td className="py-3 px-4">
                                  <span className="flex items-center gap-2">
                                    <span>{category.icon}</span>
                                    <span style={{ color: category.colorLight }}>{category.name}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-4">{etf.Nome}</td>
                                <td className="py-3 px-4 font-mono text-sm">{etf.ISIN}</td>
                                <td className="py-3 px-4">{etf.Ticker || 'N/D'}</td>
                                <td className="py-3 px-4 text-right">
                                  {(() => {
                                    if (etf.TER !== undefined && etf.TER !== null && etf.TER !== '') {
                                      const terStr = String(etf.TER).replace(',', '.');
                                      const ter = parseFloat(terStr);
                                      if (!isNaN(ter)) {
                                        return `${ter.toFixed(2)}%`;
                                      }
                                    }
                                    return 'N/D';
                                  })()}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold">
                                  {effectiveWeight.toFixed(2)}%
                                </td>
                              </tr>
                            );
                          }
                        }
                      });
                      return rows;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Analisi costi */}
            <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-700">
              <h3 className="text-xl font-semibold mb-6 text-yellow-400">💰 Analisi Costi</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h4 className="font-semibold mb-2">TER Medio Ponderato</h4>
                  <div className="text-3xl font-bold text-yellow-400">
                    {calculateWeightedTER()}%
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Costo annuo di gestione del portafoglio
                  </p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h4 className="font-semibold mb-4">Costo annuo per importo investito</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Su 10.000€:</span>
                      <span className="font-semibold">€{(10000 * parseFloat(calculateWeightedTER()) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Su 50.000€:</span>
                      <span className="font-semibold">€{(50000 * parseFloat(calculateWeightedTER()) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Su 100.000€:</span>
                      <span className="font-semibold">€{(100000 * parseFloat(calculateWeightedTER()) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Area di testo per copiare gli ISIN */}
            <div className="mt-4 bg-gray-900 rounded-xl p-6 border border-gray-700">
              <h4 className="text-sm font-semibold mb-3 text-gray-400">Lista ISIN (copia manualmente):</h4>
              <textarea
                readOnly
                value={(() => {
                  const isinList = [];
                  Object.entries(selectedETFs).forEach(([category, etfs]) => {
                    if (allocations[category] >= 1) {
                      Object.entries(etfs).forEach(([etfId, etfData]) => {
                        if (etfData && etfData.weight > 0) {
                          const etf = uploadedData?.find(e => e.id === etfId);
                          if (etf && etf.ISIN) {
                            isinList.push(etf.ISIN);
                          }
                        }
                      });
                    }
                  });
                  return isinList.join('\n');
                })()}
                className="w-full h-32 bg-gray-800 text-white p-3 rounded border border-gray-700 font-mono text-sm resize-none"
                onClick={(e) => e.target.select()}
              />
              <p className="text-xs text-gray-500 mt-2">Clicca nel campo di testo per selezionare tutto</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            ETF IMF Ptf Creator
          </h1>
          <p className="text-gray-400 text-lg">Crea e ottimizza il tuo portafoglio di ETF - Versione Desktop</p>
        </div>

        {/* Upload Section */}
        {!uploadedData || uploadedData.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 mb-10 border border-gray-700 max-w-3xl mx-auto">
            <div className="text-center">
              <Upload className="w-24 h-24 mx-auto mb-6 text-blue-400" />
              <h2 className="text-3xl font-semibold mb-6">Carica il Database ETF</h2>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    handleFileUpload(e);
                  }}
                  className="hidden"
                />
                <div className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg transition-colors text-lg">
                  Seleziona file CSV
                </div>
              </label>
              <div className="text-gray-400 mt-6 text-left max-w-xl mx-auto">
                <p className="font-semibold mb-3 text-white">Struttura CSV richiesta:</p>
                <p className="text-sm mb-3 text-yellow-400">⚠️ Tutti i campi sono obbligatori per il corretto funzionamento</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex">
                    <span className="text-gray-300 font-medium min-w-[150px]">Nome: </span>
                    <span className="ml-2">Nome commerciale completo dell'ETF</span>
                  </li>
                  <li className="flex">
                    <span className="text-gray-300 font-medium min-w-[150px]">ISIN: </span>
                    <span className="ml-2">Codice identificativo univoco (es. IE00B3F81R35)</span>
                  </li>
                  <li className="flex">
                    <span className="text-gray-300 font-medium min-w-[150px]">Ticker: </span>
                    <span className="ml-2">Simbolo di borsa dell'ETF (es. EUNA)</span>
                  </li>
                  <li className="flex">
                    <span className="text-gray-300 font-medium min-w-[150px]">Categoria: </span>
                    <span className="ml-2">Obbligazionario, Azionario, Materie Prime, Immobiliare</span>
                  </li>
                  <li className="flex">
                    <span className="text-gray-300 font-medium min-w-[150px]">Categoria Morningstar: </span>
                    <span className="ml-2">Classificazione dettagliata Morningstar</span>
                  </li>
                  <li className="flex">
                    <span className="text-gray-300 font-medium min-w-[150px]">TER: </span>
                    <span className="ml-2">Costo annuo in % (es. 0.07 per 0.07%)</span>
                  </li>
                  <li className="flex">
                    <span className="text-gray-300 font-medium min-w-[150px]">Valuta: </span>
                    <span className="ml-2">Valuta di quotazione (EUR, USD, GBP, CHF)</span>
                  </li>
                  <li className="flex">
                    <span className="text-gray-300 font-medium min-w-[150px]">AuM (Mln EUR): </span>
                    <span className="ml-2">Patrimonio gestito in milioni (solo numeri, no separatori)</span>
                  </li>
                  <li className="flex">
                    <span className="text-gray-300 font-medium min-w-[150px]">Distribuzione: </span>
                    <span className="ml-2">Acc/Accumulazione o Dist/Distribuzione</span>
                  </li>
                  <li className="flex">
                    <span className="text-gray-300 font-medium min-w-[150px]">Replica: </span>
                    <span className="ml-2">Fisica, Sintetica, Campionamento, Swap</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Database Info Section */}
            <div className="bg-gray-800 rounded-xl p-6 mb-10 border border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Database className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-2">
                      Database ETF Caricato
                    </h2>
                    <div className="space-y-1">
                      {fileName && (
                        <p className="text-gray-400 text-sm mb-1">
                          File: <span className="font-medium text-gray-300">{fileName}</span>
                        </p>
                      )}
                      <p className="text-gray-400">
                        <span className="font-medium text-2xl text-white">{uploadedData?.length || 0}</span> ETF totali nel database
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                          <span className="text-gray-400">Obbligazionari: {uploadedData?.filter(etf => etf.macroCategory === 'bonds').length || 0}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                          <span className="text-gray-400">Azionari: {uploadedData?.filter(etf => etf.macroCategory === 'equity').length || 0}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                          <span className="text-gray-400">Materie Prime: {uploadedData?.filter(etf => etf.macroCategory === 'commodities').length || 0}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                          <span className="text-gray-400">Immobiliare: {uploadedData?.filter(etf => etf.macroCategory === 'real_estate').length || 0}</span>
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
                <label className={`cursor-pointer ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <div className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors group ${
                    isLoading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
                  }`}>
                    <RefreshCw className={`w-5 h-5 transition-transform duration-500 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                    <span>{isLoading ? 'Caricamento...' : 'Aggiorna Database'}</span>
                  </div>
                </label>
              </div>
              {(getSelectedETFsCount() > 0 || totalAllocation > 0) && uploadedData && uploadedData.length > 0 && (
                <div className="mt-4 p-3 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                  <p className="text-orange-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Attenzione: aggiornando il database perderai le selezioni e allocazioni correnti
                  </p>
                </div>
              )}
            </div>

            {/* Mode Selection */}
            <div className="bg-gray-800 rounded-xl p-8 mb-10 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6">Modalità di Creazione</h2>
              <div className="grid grid-cols-3 gap-6 max-w-4xl">
                <button
                  onClick={() => setSelectedMode('custom')}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    selectedMode === 'custom'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="font-semibold text-lg">PTF CUSTOM</div>
                  <div className="text-gray-400 mt-2">Personalizzato</div>
                </button>
                <button
                  disabled
                  className="p-6 rounded-lg border-2 border-gray-700 opacity-50 cursor-not-allowed"
                >
                  <div className="font-semibold text-lg">PTF MODEL</div>
                  <div className="text-gray-400 mt-2">Pre-configurato</div>
                </button>
                <button
                  disabled
                  className="p-6 rounded-lg border-2 border-gray-700 opacity-50 cursor-not-allowed"
                >
                  <div className="font-semibold text-lg">PTF STARRED</div>
                  <div className="text-gray-400 mt-2">Preferiti</div>
                </button>
              </div>
            </div>

            {/* Allocation Section */}
            <div className={`bg-gray-800 rounded-xl p-8 mb-10 border-2 transition-all ${
              allocationStatus === 'perfect' ? 'border-green-500' : 
              allocationStatus === 'under' ? 'border-orange-500' : 'border-red-500'
            }`}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold">Allocazione Asset</h2>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold">{totalAllocation}%</span>
                  {allocationStatus === 'perfect' && <Check className="w-8 h-8 text-green-500" />}
                  {allocationStatus === 'under' && <AlertCircle className="w-8 h-8 text-orange-500" />}
                  {allocationStatus === 'over' && <X className="w-8 h-8 text-red-500" />}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  {Object.entries(macroCategories).map(([key, category]) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="flex items-center gap-3 text-lg">
                          <span className="text-2xl">{category.icon}</span>
                          <span style={{ color: category.colorLight }}>{category.name}</span>
                        </span>
                        <span className="font-bold text-xl" style={{ color: category.colorLight }}>
                          {allocations[key]}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={allocations[key]}
                        onChange={(e) => handleAllocationChange(key, parseInt(e.target.value))}
                        className="w-full h-3 rounded-lg"
                        style={{
                          background: `linear-gradient(to right, ${category.color} 0%, ${category.color} ${allocations[key]}%, #374151 ${allocations[key]}%, #374151 100%)`
                        }}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-center bg-gray-900/50 rounded-xl p-8">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <defs>
                        <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="10" height="10">
                          <path d="M0,10 l10,-10 M-5,5 l10,-10 M5,15 l10,-10" stroke="#374151" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={140}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.name === 'Non allocato' ? 'url(#diagonalHatch)' : entry.color} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          color: '#1F2937',
                          border: '1px solid #E5E7EB', 
                          borderRadius: '8px',
                          fontWeight: '600'
                        }}
                        formatter={(value, name) => {
                          if (name === 'Non allocato') {
                            return [`${value}%`, 'Da allocare'];
                          }
                          return [`${value}%`, name];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ETF Selection */}
            {totalAllocation === 0 ? (
              <div className="bg-gradient-to-r from-orange-900/20 to-amber-900/20 rounded-xl p-12 mb-10 border border-orange-700/50 text-center">
                <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Inizia impostando le allocazioni</h3>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Per selezionare gli ETF, imposta prima le percentuali di allocazione per le categorie desiderate sopra. 
                  Ogni categoria richiede almeno 1% di allocazione per essere attivata.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-8 mb-10">
                {Object.entries(macroCategories).map(([categoryKey, category]) => {
                  const allCategoryETFs = uploadedData?.filter(etf => etf.macroCategory === categoryKey) || [];
                  const categoryETFs = groupedData[categoryKey] || [];
                  const categoryWeight = getCategoryWeight(categoryKey);
                  const isComplete = categoryWeight === 100;
                  const isActive = allocations[categoryKey] >= 1;
                  
                  if (!isActive) {
                    return (
                      <div 
                        key={categoryKey} 
                        className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-xl p-8 border border-gray-700/50 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" />
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl opacity-30">{category.icon}</span>
                            <h3 className="text-2xl font-semibold text-gray-600">{category.name}</h3>
                          </div>
                          <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-800/50 mb-4">
                              <AlertCircle className="w-10 h-10 text-gray-600" />
                            </div>
                            <p className="text-lg text-gray-500 font-medium">Categoria non attiva</p>
                            <p className="text-sm text-gray-600 mt-2">Imposta almeno 1% di allocazione</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div 
                      key={categoryKey} 
                      className={`bg-gradient-to-br ${category.bgGradient} rounded-xl p-8 border-2 transition-all ${
                        isComplete 
                          ? 'border-green-400 shadow-lg shadow-green-400/20' 
                          : category.borderColor
                      }`}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-semibold flex items-center gap-3">
                          <span className="text-3xl">{category.icon}</span>
                          <span style={{ color: category.colorLight }}>{category.name}</span>
                          <span className="text-gray-400">
                            ({categoryETFs.length}{
                              (filters[categoryKey].distribution !== 'all' || 
                               filters[categoryKey].replication !== 'all' || 
                               filters[categoryKey].currency !== 'all') && 
                               categoryETFs.length !== allCategoryETFs.length &&
                               ` di ${allCategoryETFs.length}`
                            } ETF)
                            {allocations[categoryKey] > 0 && (
                              <span 
                                className="ml-2 text-xs px-2 py-1 rounded-full"
                                style={{ 
                                  backgroundColor: `${category.color}20`,
                                  color: category.colorLight
                                }}
                              >
                                {allocations[categoryKey]}% allocato
                              </span>
                            )}
                          </span>
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-xl whitespace-nowrap ${isComplete ? 'text-green-400' : 'text-orange-400'}`}>
                            {categoryWeight}% / 100%
                          </span>
                          {isComplete && <Check className="w-6 h-6 text-green-400" />}
                        </div>
                      </div>
                      
                      {/* Filtri per categoria */}
                      <div className="mb-4 p-4 bg-gray-900/30 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4" style={{ color: category.colorLight }} />
                            <span className="text-sm font-medium">Filtri e Ordinamento</span>
                          </div>
                          {(filters[categoryKey].distribution !== 'all' || 
                            filters[categoryKey].replication !== 'all' || 
                            filters[categoryKey].currency !== 'all') && (
                            <button
                              onClick={() => setFilters(prev => ({
                                ...prev,
                                [categoryKey]: {
                                  distribution: 'all',
                                  replication: 'all',
                                  currency: 'all',
                                  sortBy: prev[categoryKey].sortBy
                                }
                              }))}
                              className="text-xs text-gray-400 hover:text-white transition-colors"
                            >
                              Resetta filtri
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={filters[categoryKey].distribution}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              [categoryKey]: { ...prev[categoryKey], distribution: e.target.value }
                            }))}
                            className="bg-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
                            style={{ ':focus': { borderColor: category.color } }}
                          >
                            <option value="all">Tutti - Distribuzione</option>
                            <option value="Acc">Accumulazione</option>
                            <option value="Dist">Distribuzione</option>
                          </select>
                          
                          <select
                            value={filters[categoryKey].replication}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              [categoryKey]: { ...prev[categoryKey], replication: e.target.value }
                            }))}
                            className="bg-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
                            style={{ ':focus': { borderColor: category.color } }}
                          >
                            <option value="all">Tutti - Replica</option>
                            <option value="Fisica">Fisica</option>
                            <option value="Sintetica">Sintetica</option>
                          </select>
                          
                          <select
                            value={filters[categoryKey].currency}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              [categoryKey]: { ...prev[categoryKey], currency: e.target.value }
                            }))}
                            className="bg-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
                            style={{ ':focus': { borderColor: category.color } }}
                          >
                            <option value="all">Tutte - Valute</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                          </select>
                          
                          <select
                            value={filters[categoryKey].sortBy}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              [categoryKey]: { ...prev[categoryKey], sortBy: e.target.value }
                            }))}
                            className="bg-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
                            style={{ ':focus': { borderColor: category.color } }}
                          >
                            <option value="aum">Ordina per AuM</option>
                            <option value="ter">Ordina per TER</option>
                            <option value="name">Ordina per Nome</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-4 overflow-y-auto pr-2 pb-2" style={{ maxHeight: '520px' }}>
                        {categoryETFs.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                            <p>Nessun ETF trovato con i filtri selezionati</p>
                            <button
                              onClick={() => setFilters(prev => ({
                                ...prev,
                                [categoryKey]: {
                                  distribution: 'all',
                                  replication: 'all',
                                  currency: 'all',
                                  sortBy: prev[categoryKey].sortBy
                                }
                              }))}
                              className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Resetta filtri
                            </button>
                          </div>
                        ) : (
                          categoryETFs.map(etf => {
                            const isSelected = selectedETFs[categoryKey][etf.id];
                            const weight = selectedETFs[categoryKey][etf.id]?.weight || 0;
                            
                            return (
                              <div
                                key={etf.id}
                                className={`p-4 rounded-lg border-2 transition-all bg-gray-800/80 ${
                                  isSelected 
                                    ? `${category.borderColor} bg-opacity-90` 
                                    : 'border-gray-600 hover:border-gray-500'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex gap-3 flex-1 min-w-0">
                                    <button
                                      onClick={() => toggleStar(etf.id)}
                                      className="transition-colors flex-shrink-0 mt-1"
                                    >
                                      <Star
                                        className={`w-5 h-5 ${
                                          starredETFs.has(etf.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'
                                        }`}
                                      />
                                    </button>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-semibold text-base truncate" title={etf.Nome}>
                                        {etf.Nome}
                                      </div>
                                      <div className="text-gray-400 text-sm">{etf.ISIN}</div>
                                      
                                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mt-3">
                                        <div className="flex items-center gap-1 min-w-[120px]">
                                          <TrendingUp className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                          <span className="truncate">TER: {(() => {
                                            if (etf.TER !== undefined && etf.TER !== null && etf.TER !== '') {
                                              const terStr = String(etf.TER).replace(',', '.');
                                              const ter = parseFloat(terStr);
                                              if (!isNaN(ter)) {
                                                // Il valore nel CSV è già una percentuale (es. 0.07 = 0.07%)
                                                return `${ter.toFixed(2)}%`;
                                              }
                                            }
                                            return 'N/D';
                                          })()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                          <span title="Clicca per info debug" 
                                                onClick={() => console.log('ETF data:', etf)}
                                                className="cursor-help truncate">
                                            AuM: {(() => {
                                              // Approccio super flessibile per trovare AuM
                                              let aumValue = null;
                                              let foundKey = null;
                                              
                                              // Prova prima i nomi esatti più comuni
                                              const exactKeys = [
                                                'AuM (Mln EUR)',
                                                'AuM (Mln EUR)', // Con spazi diversi
                                                'AuM(Mln EUR)',  // Senza spazio
                                                'AUM (MLN EUR)',
                                                'AuM',
                                                'AUM',
                                                'Assets under Management',
                                                'AuM (Mln €)',
                                                'AuM Mln EUR',
                                                'AuM Mln €',
                                                'aum',
                                                'Aum'
                                              ];
                                              
                                              for (const key of exactKeys) {
                                                if (etf[key] !== undefined && etf[key] !== null && etf[key] !== '') {
                                                  aumValue = etf[key];
                                                  foundKey = key;
                                                  break;
                                                }
                                              }
                                              
                                              // Se non trova, cerca in tutti i campi
                                              if (!aumValue) {
                                                for (const [key, value] of Object.entries(etf)) {
                                                  const keyLower = key.toLowerCase();
                                                  if ((keyLower.includes('aum') || 
                                                       keyLower.includes('assets') || 
                                                       (keyLower.includes('mln') && keyLower.includes('eur'))) &&
                                                      value !== undefined && 
                                                      value !== null && 
                                                      value !== '') {
                                                    aumValue = value;
                                                    foundKey = key;
                                                    break;
                                                  }
                                                }
                                              }
                                              
                                              if (aumValue) {
                                                // Converti in numero
                                                const numStr = String(aumValue)
                                                  .replace(/[^\d.,\-]/g, '') // Rimuovi tutto tranne numeri, punti, virgole e segno meno
                                                  .replace(',', '.');        // Converti virgola in punto
                                                
                                                const num = parseFloat(numStr);
                                                
                                                if (!isNaN(num)) {
                                                  return `${num.toLocaleString('it-IT', { 
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0 
                                                  })}M€`;
                                                }
                                                // Se non è un numero valido, mostra il valore originale
                                                return `${aumValue}`;
                                              }
                                              
                                              return 'N/D';
                                            })()}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Package className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                          <span className="truncate">{etf.Distribuzione || 'N/D'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Building className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                          <span className="truncate">{etf.Valuta || 'N/D'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => toggleETFSelection(categoryKey, etf.id)}
                                    className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm flex-shrink-0 ${
                                      isSelected 
                                        ? `bg-${category.colorDark} hover:bg-${category.color}` 
                                        : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                    style={{
                                      backgroundColor: isSelected ? category.colorDark : undefined,
                                      ':hover': { backgroundColor: isSelected ? category.color : undefined }
                                    }}
                                  >
                                    {isSelected ? 'Rimuovi' : 'Aggiungi'}
                                  </button>
                                </div>
                                
                                {isSelected && (
                                  <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-sm">Peso nel portafoglio:</span>
                                      <span className="font-bold text-xl" style={{ color: category.colorLight }}>
                                        {weight}%
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => updateETFWeight(categoryKey, etf.id, weight - 1)}
                                        className="w-8 h-8 flex-shrink-0 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
                                      >
                                        <Minus className="w-4 h-4" />
                                      </button>
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={weight}
                                        onChange={(e) => updateETFWeight(categoryKey, etf.id, parseInt(e.target.value))}
                                        className="flex-1 h-2 cursor-pointer"
                                        style={{
                                          background: `linear-gradient(to right, ${category.color} 0%, ${category.color} ${weight}%, #374151 ${weight}%, #374151 100%)`
                                        }}
                                      />
                                      <button
                                        onClick={() => updateETFWeight(categoryKey, etf.id, weight + 1)}
                                        className="w-8 h-8 flex-shrink-0 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="text-sm text-gray-400 mt-2">
                                      Peso effettivo nel portafoglio totale: 
                                      <span className="font-semibold" style={{ color: category.colorLight }}>
                                        {' '}{((weight / 100) * allocations[categoryKey]).toFixed(2)}%
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-10 border border-blue-700">
              <h2 className="text-3xl font-semibold mb-8">Riepilogo Portafoglio</h2>
              <div className="grid grid-cols-3 gap-8">
                <div className="bg-gray-800/50 rounded-xl p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="w-8 h-8 text-blue-400" />
                    <span className="text-gray-400 text-lg">ETF Totali</span>
                  </div>
                  <div className="text-5xl font-bold">{getSelectedETFsCount()}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-8 h-8 text-green-400" />
                    <span className="text-gray-400 text-lg">Copertura</span>
                  </div>
                  <div className="text-5xl font-bold">{getPortfolioCoverage()}%</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-8 h-8 text-yellow-400" />
                    <span className="text-gray-400 text-lg">TER Medio</span>
                  </div>
                  <div className="text-5xl font-bold">{calculateWeightedTER()}%</div>
                </div>
              </div>
              
              {/* Export Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowExportView(true)}
                  disabled={!isPortfolioComplete()}
                  className={`inline-flex items-center gap-3 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform ${
                    isPortfolioComplete()
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105 shadow-lg'
                      : 'bg-gray-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Download className="w-6 h-6" />
                  ESPORTA PORTAFOGLIO
                </button>
                {!isPortfolioComplete() && (
                  <p className="mt-3 text-sm text-gray-400 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Completa l'allocazione al 100% per esportare
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
};

export default ETFPortfolioCreator;