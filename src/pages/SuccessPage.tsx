import React from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'

export function SuccessPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Paiement réussi !
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Votre abonnement a été activé avec succès.
            </p>
          </div>

          <div className="mt-6">
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Accéder au tableau de bord
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}