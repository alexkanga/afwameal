'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import {
  QrCode,
  Download,
  BarChart3,
  FileText,
  Users,
  Clock,
  Copy,
  CheckCircle,
  ArrowLeft,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Star,
  Pencil,
  X,
  GripVertical,
} from 'lucide-react'
import { toast } from 'sonner'

// Types
interface Question {
  id: string
  text: string
  order: number
  ratingLabels: string | null
}

interface Segment {
  id: string
  title: string
  order: number
  questions: Question[]
}

interface Survey {
  id: string
  title: string
  description: string | null
  isActive: boolean
  createdAt: string
  segments: Segment[]
  _count?: { responses: number }
}

interface Answer {
  id: string
  questionId: string
  rating: number
  question: Question & { segment: Segment }
}

interface Response {
  id: string
  respondentName: string | null
  respondentEmail: string | null
  submittedAt: string
  answers: Answer[]
}

interface Analytics {
  surveyId: string
  surveyTitle: string
  totalResponses: number
  overallAverage: number
  overallDistribution: Record<string, number>
  segmentAnalytics: {
    segmentId: string
    segmentTitle: string
    averageRating: number
    questionAnalytics: {
      questionId: string
      questionText: string
      averageRating: number
      totalAnswers: number
      distribution: Record<string, number>
    }[]
  }[]
  responseData: { date: string; count: number }[]
}

// Default rating colors
const RATING_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
]

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']

// Default rating labels
const DEFAULT_RATING_LABELS = [
  'Très insuffisant',
  'Insuffisant',
  'Satisfaisant',
  'Très satisfaisant',
  'Excellent',
]

// Helper to parse rating labels
const getRatingLabels = (question: Question): string[] => {
  if (question.ratingLabels) {
    try {
      return JSON.parse(question.ratingLabels)
    } catch {
      return DEFAULT_RATING_LABELS
    }
  }
  return DEFAULT_RATING_LABELS
}

type View = 'dashboard' | 'form' | 'responses' | 'analytics' | 'create'

// Survey Builder Component
function SurveyBuilder({ onSave, onCancel }: { onSave: (survey: Partial<Survey>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [segments, setSegments] = useState<{ title: string; questions: { text: string; ratingLabels: string[] }[] }[]>([
    { title: '', questions: [{ text: '', ratingLabels: [...DEFAULT_RATING_LABELS] }] }
  ])
  const [saving, setSaving] = useState(false)

  const addSegment = () => {
    setSegments([...segments, { title: '', questions: [{ text: '', ratingLabels: [...DEFAULT_RATING_LABELS] }] }])
  }

  const removeSegment = (index: number) => {
    if (segments.length > 1) {
      setSegments(segments.filter((_, i) => i !== index))
    }
  }

  const addQuestion = (segmentIndex: number) => {
    const newSegments = [...segments]
    newSegments[segmentIndex].questions.push({ text: '', ratingLabels: [...DEFAULT_RATING_LABELS] })
    setSegments(newSegments)
  }

  const removeQuestion = (segmentIndex: number, questionIndex: number) => {
    const newSegments = [...segments]
    if (newSegments[segmentIndex].questions.length > 1) {
      newSegments[segmentIndex].questions.splice(questionIndex, 1)
      setSegments(newSegments)
    }
  }

  const updateSegmentTitle = (index: number, value: string) => {
    const newSegments = [...segments]
    newSegments[index].title = value
    setSegments(newSegments)
  }

  const updateQuestionText = (segmentIndex: number, questionIndex: number, value: string) => {
    const newSegments = [...segments]
    newSegments[segmentIndex].questions[questionIndex].text = value
    setSegments(newSegments)
  }

  const updateRatingLabel = (segmentIndex: number, questionIndex: number, labelIndex: number, value: string) => {
    const newSegments = [...segments]
    newSegments[segmentIndex].questions[questionIndex].ratingLabels[labelIndex] = value
    setSegments(newSegments)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Le titre est requis')
      return
    }

    // Validate segments have questions with text
    const validSegments = segments.filter(s => s.title.trim() && s.questions.some(q => q.text.trim()))
    if (validSegments.length === 0) {
      toast.error('Au moins un segment avec une question est requis')
      return
    }

    setSaving(true)
    try {
      const surveyData = {
        title,
        description,
        segments: validSegments.map(s => ({
          title: s.title,
          questions: s.questions.filter(q => q.text.trim()).map(q => ({
            text: q.text,
            ratingLabels: JSON.stringify(q.ratingLabels),
          })),
        })),
      }

      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyData),
      })

      if (res.ok) {
        const savedSurvey = await res.json()
        toast.success('Questionnaire créé avec succès !')
        onSave(savedSurvey)
      } else {
        toast.error('Erreur lors de la création')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Créer un nouveau questionnaire</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Création...' : 'Créer le questionnaire'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="survey-title">Titre du questionnaire *</Label>
            <Input
              id="survey-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Enquête de satisfaction - Conférence 2024"
            />
          </div>
          <div>
            <Label htmlFor="survey-description">Description (optionnel)</Label>
            <Textarea
              id="survey-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du questionnaire..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {segments.map((segment, segmentIndex) => (
        <Card key={segmentIndex}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              Segment {segmentIndex + 1}
            </CardTitle>
            {segments.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeSegment(segmentIndex)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Titre du segment *</Label>
              <Input
                value={segment.title}
                onChange={(e) => updateSegmentTitle(segmentIndex, e.target.value)}
                placeholder="Ex: Organisation Générale"
              />
            </div>

            <div className="space-y-4">
              {segment.questions.map((question, questionIndex) => (
                <Card key={questionIndex} className="border-dashed">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium mt-2">Q{questionIndex + 1}</span>
                      <div className="flex-1">
                        <Textarea
                          value={question.text}
                          onChange={(e) => updateQuestionText(segmentIndex, questionIndex, e.target.value)}
                          placeholder="Texte de la question..."
                          rows={2}
                        />
                      </div>
                      {segment.questions.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeQuestion(segmentIndex, questionIndex)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="pl-6 space-y-1">
                      <Label className="text-xs text-muted-foreground">Échelle d'évaluation (5 niveaux)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {question.ratingLabels.map((label, labelIndex) => (
                          <div key={labelIndex} className="flex items-center gap-1">
                            <span className={`w-6 h-6 rounded ${RATING_COLORS[labelIndex]} flex items-center justify-center text-white text-xs font-medium`}>
                              {labelIndex + 1}
                            </span>
                            <Input
                              value={label}
                              onChange={(e) => updateRatingLabel(segmentIndex, questionIndex, labelIndex, e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={() => addQuestion(segmentIndex)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une question
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addSegment} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un segment
      </Button>
    </div>
  )
}

export default function Home() {
  const [view, setView] = useState<View>('dashboard')
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [qrCodeData, setQrCodeData] = useState<{ qrCode: string; url: string } | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Record<string, number>>({})
  const [respondentName, setRespondentName] = useState('')
  const [respondentEmail, setRespondentEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Check URL for form parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const formId = params.get('form')
    if (formId) {
      fetchSurvey(formId, 'form')
    }
  }, [])

  // Fetch surveys on mount
  useEffect(() => {
    fetchSurveys()
    initDefaultSurveys()
  }, [])

  const initDefaultSurveys = async () => {
    try {
      const res = await fetch('/api/init', { method: 'POST' })
      const data = await res.json()
      if (data.created > 0) {
        fetchSurveys()
      }
      setInitialized(true)
    } catch (error) {
      console.error('Init error:', error)
    }
  }

  const fetchSurveys = async () => {
    try {
      const res = await fetch('/api/surveys')
      const data = await res.json()
      setSurveys(data)
    } catch (error) {
      console.error('Error fetching surveys:', error)
    }
  }

  const fetchSurvey = async (id: string, targetView: View = 'dashboard') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/surveys/${id}`)
      const data = await res.json()
      setSelectedSurvey(data)
      setView(targetView)
      
      // Initialize form data
      const initialData: Record<string, number> = {}
      data.segments.forEach((segment: Segment) => {
        segment.questions.forEach((question: Question) => {
          initialData[question.id] = 3
        })
      })
      setFormData(initialData)
    } catch (error) {
      console.error('Error fetching survey:', error)
      toast.error('Erreur lors du chargement du questionnaire')
    } finally {
      setLoading(false)
    }
  }

  const fetchResponses = async (surveyId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/surveys/${surveyId}/responses`)
      const data = await res.json()
      setResponses(data)
    } catch (error) {
      console.error('Error fetching responses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async (surveyId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/surveys/${surveyId}/analytics`)
      const data = await res.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQRCode = async (surveyId: string) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}/qrcode`)
      const data = await res.json()
      setQrCodeData(data)
      setShowQRModal(true)
    } catch (error) {
      console.error('Error fetching QR code:', error)
      toast.error('Erreur lors de la génération du QR code')
    }
  }

  const copyLink = () => {
    if (qrCodeData?.url) {
      navigator.clipboard.writeText(qrCodeData.url)
      setCopied(true)
      toast.success('Lien copié !')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const submitResponse = async () => {
    if (!selectedSurvey) return
    
    setSubmitting(true)
    try {
      const answers = Object.entries(formData).map(([questionId, rating]) => ({
        questionId,
        rating,
      }))

      const res = await fetch(`/api/surveys/${selectedSurvey.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondentName,
          respondentEmail,
          answers,
        }),
      })

      if (res.ok) {
        toast.success('Réponses soumises avec succès !')
        setView('dashboard')
        setFormData({})
        setRespondentName('')
        setRespondentEmail('')
      } else {
        toast.error('Erreur lors de la soumission')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  const exportToExcel = async (surveyId: string) => {
    try {
      toast.info('Export en cours...')
      const res = await fetch(`/api/surveys/${surveyId}/export`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `survey-${surveyId}-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Export réussi !')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Erreur lors de l\'export')
    }
  }

  const deleteSurvey = async (surveyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce questionnaire ? Toutes les réponses seront perdues.')) return
    
    try {
      const res = await fetch(`/api/surveys/${surveyId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Questionnaire supprimé')
        fetchSurveys()
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  // Navigation handlers
  const handleViewResponses = (survey: Survey) => {
    setSelectedSurvey(survey)
    fetchResponses(survey.id)
    setView('responses')
  }

  const handleViewAnalytics = (survey: Survey) => {
    setSelectedSurvey(survey)
    fetchAnalytics(survey.id)
    setView('analytics')
  }

  const handleOpenForm = (survey: Survey) => {
    fetchSurvey(survey.id, 'form')
  }

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plateforme MEAL</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion des enquêtes et évaluations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setView('create')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau questionnaire
          </Button>
          <Button onClick={fetchSurveys} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questionnaires</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surveys.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Réponses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {surveys.reduce((sum, s) => sum + (s._count?.responses || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {surveys.filter(s => s._count?.responses && s._count.responses > 0).length} actif{surveys.filter(s => s._count?.responses && s._count.responses > 0).length > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {surveys.map((survey) => (
          <Card key={survey.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{survey.title}</CardTitle>
                  <CardDescription>{survey.description}</CardDescription>
                </div>
                <Badge variant={survey.isActive ? 'default' : 'secondary'}>
                  {survey.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(survey.createdAt).toLocaleDateString('fr-FR')}
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {survey.segments.length} segment{survey.segments.length > 1 ? 's' : ''}
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {survey.segments.reduce((sum, s) => sum + s.questions.length, 0)} questions
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {survey._count?.responses || 0} réponse{survey._count?.responses && survey._count.responses > 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleOpenForm(survey)} variant="default" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir
                </Button>
                <Button onClick={() => fetchQRCode(survey.id)} variant="outline" size="sm">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
                <Button onClick={() => handleViewResponses(survey)} variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Réponses
                </Button>
                <Button onClick={() => handleViewAnalytics(survey)} variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyse
                </Button>
                <Button onClick={() => exportToExcel(survey.id)} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={() => deleteSurvey(survey.id)} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {surveys.length === 0 && !initialized && (
          <Card className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground mt-4">Initialisation...</p>
          </Card>
        )}

        {surveys.length === 0 && initialized && (
          <Card className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun questionnaire disponible</p>
            <Button onClick={() => setView('create')} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Créer un questionnaire
            </Button>
          </Card>
        )}
      </div>
    </div>
  )

  // Render Survey Form
  const renderForm = () => {
    if (!selectedSurvey) return null

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setView('dashboard')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au tableau de bord
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{selectedSurvey.title}</CardTitle>
            <CardDescription>{selectedSurvey.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="name">Nom (optionnel)</Label>
                <Input
                  id="name"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <Label htmlFor="email">Email (optionnel)</Label>
                <Input
                  id="email"
                  type="email"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder="votre@email.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedSurvey.segments.map((segment) => (
          <Card key={segment.id}>
            <CardHeader>
              <CardTitle className="text-lg">{segment.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {segment.questions.map((question, index) => {
                const labels = getRatingLabels(question)
                return (
                  <div key={question.id} className="space-y-3">
                    <p className="font-medium">
                      {index + 1}. {question.text}
                    </p>
                    <RadioGroup
                      value={String(formData[question.id] || 3)}
                      onValueChange={(value) => 
                        setFormData({ ...formData, [question.id]: parseInt(value) })
                      }
                      className="flex flex-wrap gap-3"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <div key={rating} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={String(rating)}
                            id={`${question.id}-${rating}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`${question.id}-${rating}`}
                            className={`
                              flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer
                              transition-all hover:border-primary
                              peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10
                            `}
                          >
                            <span className={`
                              w-6 h-6 rounded-full ${RATING_COLORS[rating - 1]}
                              flex items-center justify-center text-white text-sm font-medium
                            `}>
                              {rating}
                            </span>
                            <span className="hidden lg:inline text-sm">
                              {labels[rating - 1]}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setView('dashboard')}>
            Annuler
          </Button>
          <Button onClick={submitResponse} disabled={submitting}>
            {submitting ? 'Soumission...' : 'Soumettre les réponses'}
          </Button>
        </div>
      </div>
    )
  }

  // Render Responses DataGrid
  const renderResponses = () => {
    if (!selectedSurvey) return null

    const allQuestions = selectedSurvey.segments.flatMap(s => s.questions)

    const getRatingBadge = (rating: number, labels: string[]) => (
      <Badge className={`${RATING_COLORS[rating - 1]} text-white`}>
        {rating} - {labels[rating - 1]}
      </Badge>
    )

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setView('dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Réponses - {selectedSurvey.title}</h1>
              <p className="text-muted-foreground">{responses.length} réponse{responses.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => fetchResponses(selectedSurvey.id)} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => exportToExcel(selectedSurvey.id)} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background w-[50px]">#</TableHead>
                    <TableHead className="sticky top-0 bg-background min-w-[150px]">Participant</TableHead>
                    <TableHead className="sticky top-0 bg-background min-w-[150px]">Date</TableHead>
                    {selectedSurvey.segments.map(segment => (
                      segment.questions.map((q, i) => (
                        <TableHead key={q.id} className="sticky top-0 bg-background min-w-[120px]">
                          <div className="text-xs text-muted-foreground">{segment.title.substring(0, 15)}...</div>
                          <div>Q{i + 1}</div>
                        </TableHead>
                      ))
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={allQuestions.length + 3} className="text-center py-8">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : responses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={allQuestions.length + 3} className="text-center py-8">
                        Aucune réponse pour le moment
                      </TableCell>
                    </TableRow>
                  ) : (
                    responses.map((response, index) => (
                      <TableRow key={response.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{response.respondentName || 'Anonyme'}</div>
                            {response.respondentEmail && (
                              <div className="text-xs text-muted-foreground">{response.respondentEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(response.submittedAt).toLocaleString('fr-FR')}
                        </TableCell>
                        {selectedSurvey.segments.flatMap(s => s.questions).map(question => {
                          const answer = response.answers.find(a => a.questionId === question.id)
                          const labels = getRatingLabels(question)
                          return (
                            <TableCell key={question.id}>
                              {answer ? getRatingBadge(answer.rating, labels) : '-'}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render Analytics
  const renderAnalytics = () => {
    if (!selectedSurvey || !analytics) return null

    const pieData = Object.entries(analytics.overallDistribution)
      .filter(([, count]) => count > 0)
      .map(([rating, count]) => ({
        name: `Note ${rating}`,
        value: count,
        rating: parseInt(rating),
      }))

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setView('dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Analyse - {selectedSurvey.title}</h1>
              <p className="text-muted-foreground">Analyse en temps réel</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => fetchAnalytics(selectedSurvey.id)} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => exportToExcel(selectedSurvey.id)} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Réponses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.totalResponses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Note Moyenne Globale</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                {analytics.overallAverage.toFixed(2)}
                <span className="text-lg text-muted-foreground">/5</span>
              </div>
              <Progress value={(analytics.overallAverage / 5) * 100} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Niveau de Satisfaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics.overallAverage >= 4 ? 'Excellent' : 
                 analytics.overallAverage >= 3 ? 'Satisfaisant' : 
                 analytics.overallAverage >= 2 ? 'Insuffisant' : 'Très insuffisant'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution des Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={`cell-${entry.rating}`} fill={COLORS[entry.rating - 1]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>

          {/* Responses Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Réponses</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.responseData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.responseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Segment Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Analyse par Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={analytics.segmentAnalytics.map(s => ({
                  name: s.segmentTitle.substring(0, 20),
                  moyenne: s.averageRating,
                }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip />
                <Bar dataKey="moyenne" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Question Analytics */}
        {analytics.segmentAnalytics.map((segment) => (
          <Card key={segment.segmentId}>
            <CardHeader>
              <CardTitle className="text-lg">{segment.segmentTitle}</CardTitle>
              <CardDescription>
                Moyenne du segment: {segment.averageRating.toFixed(2)}/5
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {segment.questionAnalytics.map((q, index) => (
                  <div key={q.questionId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Q{index + 1}: {q.questionText.substring(0, 60)}...
                      </span>
                      <Badge variant="outline">
                        {q.averageRating.toFixed(2)}/5 ({q.totalAnswers} réponses)
                      </Badge>
                    </div>
                    <div className="flex gap-1 h-6">
                      {[1, 2, 3, 4, 5].map(rating => {
                        const count = q.distribution[rating] || 0
                        const percentage = q.totalAnswers > 0 ? (count / q.totalAnswers) * 100 : 0
                        return (
                          <div
                            key={rating}
                            className={`${RATING_COLORS[rating - 1]} h-full transition-all`}
                            style={{ width: `${percentage}%`, minWidth: count > 0 ? '4px' : '0' }}
                            title={`Note ${rating}: ${count} (${percentage.toFixed(1)}%)`}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Render Create Survey
  const renderCreate = () => (
    <SurveyBuilder
      onSave={() => {
        setView('dashboard')
        fetchSurveys()
      }}
      onCancel={() => setView('dashboard')}
    />
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 pb-20">
        {view === 'dashboard' && renderDashboard()}
        {view === 'form' && renderForm()}
        {view === 'responses' && renderResponses()}
        {view === 'analytics' && renderAnalytics()}
        {view === 'create' && renderCreate()}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t py-3">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Plateforme MEAL - Évaluation et Analyse
          </div>
          <div className="flex gap-2">
            {view !== 'dashboard' && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setView('dashboard')}
              >
                Tableau de bord
              </Button>
            )}
            {view === 'dashboard' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setView('create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau
              </Button>
            )}
          </div>
        </div>
      </footer>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code du Questionnaire</DialogTitle>
            <DialogDescription>
              Scannez ce QR code pour accéder au formulaire
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {qrCodeData && (
              <>
                <img 
                  src={qrCodeData.qrCode} 
                  alt="QR Code" 
                  className="w-64 h-64 border rounded-lg"
                />
                <div className="flex w-full items-center space-x-2">
                  <Input 
                    value={qrCodeData.url} 
                    readOnly 
                    className="flex-1"
                  />
                  <Button onClick={copyLink} size="icon">
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
