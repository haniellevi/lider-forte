'use client';

import React, { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { 
  LeadershipPipelineDashboard, 
  MemberLeadershipProfile, 
  LeadershipAssessmentForm 
} from '@/components/Leadership';

type ViewMode = 'dashboard' | 'member-profile' | 'assessment';

export default function LeadershipPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string>('');

  const handleMemberSelect = (memberId: string, memberName?: string) => {
    setSelectedMemberId(memberId);
    setSelectedMemberName(memberName || '');
    setViewMode('member-profile');
  };

  const handleShowAssessment = (memberId: string, memberName: string) => {
    setSelectedMemberId(memberId);
    setSelectedMemberName(memberName);
    setViewMode('assessment');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setSelectedMemberId(null);
    setSelectedMemberName('');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/app' },
    { label: 'Pipeline de Liderança', href: '/app/leadership' },
    ...(viewMode === 'member-profile' && selectedMemberName ? 
      [{ label: selectedMemberName, href: '#' }] : []
    ),
    ...(viewMode === 'assessment' && selectedMemberName ? 
      [{ label: `Avaliação - ${selectedMemberName}`, href: '#' }] : []
    ),
  ];

  return (
    <>
      <Breadcrumb pageName="Pipeline de Liderança" items={breadcrumbItems} />
      
      <div className="mx-auto max-w-7xl">
        {viewMode === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Pipeline de Liderança</h1>
                <p className="text-gray-600">
                  Sistema de identificação automática de potencial de liderança usando IA
                </p>
              </div>
            </div>

            <LeadershipPipelineDashboard
              onMemberSelect={handleMemberSelect}
            />
          </div>
        )}

        {viewMode === 'member-profile' && selectedMemberId && (
          <div className="space-y-6">
            <MemberLeadershipProfile
              memberId={selectedMemberId}
              onBack={handleBackToDashboard}
            />
            
            {/* Quick Assessment Button */}
            <div className="flex justify-center">
              <button
                onClick={() => handleShowAssessment(selectedMemberId, selectedMemberName)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Realizar Nova Avaliação
              </button>
            </div>
          </div>
        )}

        {viewMode === 'assessment' && selectedMemberId && (
          <div className="space-y-6">
            <LeadershipAssessmentForm
              profileId={selectedMemberId}
              memberName={selectedMemberName}
              onSuccess={() => {
                setViewMode('member-profile');
              }}
              onCancel={() => {
                setViewMode('member-profile');
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}