"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

interface HealthData {
  ok: boolean
  status: string
  environment: any
  services: any
  performance: any
  recommendations: string[]
  meta: any
}

function ServiceStatus({ service, data }: { service: string, data: any }) {
  const getStatusColor = (ok: boolean) => ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  const getStatusIcon = (ok: boolean) => ok ? '✅' : '❌'
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="capitalize">{service}</span>
          <Badge className={getStatusColor(data.ok)}>
            {getStatusIcon(data.ok)} {data.ok ? 'Opérationnel' : 'Indisponible'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {data.response_time_ms && (
            <div className="flex justify-between">
              <span>Temps de réponse:</span>
              <span className={data.response_time_ms > 3000 ? 'text-red-600' : 'text-green-600'}>
                {data.response_time_ms}ms
              </span>
            </div>
          )}
          {data.status && (
            <div className="flex justify-between">
              <span>Status HTTP:</span>
              <span>{data.status}</span>
            </div>
          )}
          {data.error && (
            <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
              {data.error}
            </div>
          )}
          {data.timestamp && (
            <div className="text-xs text-gray-500">
              Dernière vérification: {new Date(data.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function DatabaseStatus({ database }: { database: any }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          Base de données
          <Badge className={database.postgres ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {database.postgres ? '✅ Connectée' : '❌ Déconnectée'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>PostgreSQL:</span>
            <span>{database.postgres ? '✅' : '❌'}</span>
          </div>
          <div className="flex justify-between">
            <span>Supabase:</span>
            <span>{database.supabase ? '✅' : '❌'}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="capitalize">{database.status}</span>
          </div>
          {database.connection_type && (
            <div className="flex justify-between">
              <span>Type:</span>
              <span>{database.connection_type}</span>
            </div>
          )}
          {database.error && (
            <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
              {database.error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PerformanceMetrics({ performance }: { performance: any }) {
  const availabilityColor = performance.availability_percentage >= 90 ? 'text-green-600' : 
                           performance.availability_percentage >= 70 ? 'text-yellow-600' : 'text-red-600'
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">📊 Métriques de performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Disponibilité des services</span>
              <span className={availabilityColor}>
                {performance.availability_percentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={performance.availability_percentage} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Services testés:</span>
              <div className="font-semibold">{performance.external_services_tested}</div>
            </div>
            <div>
              <span className="text-gray-600">Services disponibles:</span>
              <div className="font-semibold text-green-600">{performance.services_available}</div>
            </div>
            <div>
              <span className="text-gray-600">Temps de réponse moyen:</span>
              <div className="font-semibold">{performance.average_response_time_ms.toFixed(0)}ms</div>
            </div>
            <div>
              <span className="text-gray-600">Base de données:</span>
              <div className="font-semibold">
                {performance.database_available ? '✅ OK' : '❌ KO'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EnvironmentInfo({ environment }: { environment: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">🔧 Configuration environnement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Mode:</span>
            <Badge variant={environment.mode === 'production' ? 'default' : 'secondary'}>
              {environment.mode}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Production:</span>
            <span>{environment.production ? '✅' : '❌'}</span>
          </div>
          
          <div>
            <span className="text-sm text-gray-600 block mb-2">Services configurés:</span>
            <div className="flex flex-wrap gap-1">
              {environment.configured_services.map((service: string) => (
                <Badge key={service} variant="outline" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
          
          {environment.validation && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Configuration valide:</span>
                <span>{environment.validation.valid ? '✅' : '❌'}</span>
              </div>
              
              {environment.validation.issues.length > 0 && (
                <div className="text-xs">
                  <span className="text-red-600 font-medium block mb-1">Problèmes:</span>
                  {environment.validation.issues.map((issue: string, i: number) => (
                    <div key={i} className="text-red-600 ml-2">• {issue}</div>
                  ))}
                </div>
              )}
              
              {environment.validation.recommendations.length > 0 && (
                <div className="text-xs mt-2">
                  <span className="text-blue-600 font-medium block mb-1">Recommandations:</span>
                  {environment.validation.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="text-blue-600 ml-2">• {rec}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SystemRecommendations({ recommendations }: { recommendations: string[] }) {
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">✅ Système optimal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600">
            Tous les systèmes fonctionnent parfaitement. Aucune action requise.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">💡 Recommandations système</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <div key={i} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded text-sm">
              {rec}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchHealthData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/health/advanced')
      const data = await response.json()
      setHealthData(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch health data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !healthData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des métriques système...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!healthData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-600">Erreur lors du chargement des données système</p>
            <Button onClick={fetchHealthData} className="mt-4">
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🔧 Dashboard Administrateur</h1>
            <p className="text-gray-600">Surveillance et métriques VeganFlemme</p>
          </div>
          
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <span className="text-sm text-gray-500">
                Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <Button onClick={fetchHealthData} disabled={loading}>
              {loading ? '🔄' : '↻'} Actualiser
            </Button>
          </div>
        </div>

        {/* Overall Status Banner */}
        <Card className={`mb-6 ${
          healthData.status === 'healthy' ? 'border-green-200 bg-green-50' :
          healthData.status === 'degraded' ? 'border-yellow-200 bg-yellow-50' :
          'border-red-200 bg-red-50'
        }`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {healthData.status === 'healthy' ? '🟢' :
                   healthData.status === 'degraded' ? '🟡' : '🔴'}
                </span>
                <div>
                  <h3 className="font-semibold">
                    Status: {healthData.status === 'healthy' ? 'Système opérationnel' :
                             healthData.status === 'degraded' ? 'Performance dégradée' :
                             'Problème critique'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Phase: {healthData.meta.phase}
                  </p>
                </div>
              </div>
              <Badge variant={healthData.ok ? 'default' : 'destructive'} className="text-lg px-4 py-2">
                {healthData.ok ? 'OK' : 'ALERTE'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="services">Services externes</TabsTrigger>
            <TabsTrigger value="database">Base de données</TabsTrigger>
            <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PerformanceMetrics performance={healthData.performance} />
              <EnvironmentInfo environment={healthData.environment} />
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(healthData.services.external).map(([service, data]) => (
                <ServiceStatus key={service} service={service} data={data} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DatabaseStatus database={healthData.services.database} />
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">🔍 Diagnostic détaillé</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded font-mono text-xs">
                      <pre>{JSON.stringify(healthData.services.database, null, 2)}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <SystemRecommendations recommendations={healthData.recommendations} />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📈 Métriques techniques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded text-center">
                    <div className="font-bold text-lg">{healthData.performance.response_time_ms}ms</div>
                    <div className="text-gray-600">Temps total vérification</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded text-center">
                    <div className="font-bold text-lg">{healthData.meta.uptime_check_duration_ms}ms</div>
                    <div className="text-gray-600">Durée check santé</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded text-center">
                    <div className="font-bold text-lg">{healthData.environment.configured_services.length}</div>
                    <div className="text-gray-600">Services configurés</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded text-center">
                    <div className="font-bold text-lg">{healthData.meta.version}</div>
                    <div className="text-gray-600">Version application</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}