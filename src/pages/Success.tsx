import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function Success() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Paiement réussi !
          </h2>
          
          <p className="text-gray-600 mb-8">
            Votre abonnement a été activé avec succès. Vous pouvez maintenant accéder à toutes les fonctionnalités.
          </p>
          
          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link to="/">
                Retour à l'accueil
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link to="/dashboard">
                Accéder au tableau de bord
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}