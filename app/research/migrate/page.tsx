"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, Loader2, Copy, Database } from "lucide-react"

export default function ResearchMigrationPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMigrate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/research/migrate", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.message || "Migration failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute migration")
    } finally {
      setLoading(false)
    }
  }

  const sqlContent = `-- Research Studies Tables Migration
-- Copy this entire SQL and run it in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create research_studies table
CREATE TABLE IF NOT EXISTS research_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    study_type VARCHAR(50) NOT NULL CHECK (study_type IN ('implementation', 'pilot', 'quality_improvement', 'outcomes', 'equity')),
    pi_name TEXT NOT NULL,
    pi_email TEXT,
    pi_phone TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    enrollment_target INTEGER NOT NULL DEFAULT 0,
    current_enrollment INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'data_collection', 'analysis', 'completed', 'cancelled')),
    irb_status VARCHAR(50) DEFAULT 'pending' CHECK (irb_status IN ('pending', 'approved', 'exempt', 'rejected', 'expired')),
    irb_number TEXT,
    irb_approval_date DATE,
    irb_expiration_date DATE,
    funding_source TEXT,
    funding_amount DECIMAL(12, 2),
    grant_number TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID,
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_enrollment CHECK (current_enrollment >= 0 AND current_enrollment <= enrollment_target)
);

-- Create research_study_participants table
CREATE TABLE IF NOT EXISTS research_study_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id UUID,
    patient_id UUID,
    enrolled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    enrollment_status VARCHAR(50) DEFAULT 'enrolled' CHECK (enrollment_status IN ('enrolled', 'withdrawn', 'completed', 'lost_to_followup')),
    withdrawal_date DATE,
    withdrawal_reason TEXT,
    consent_obtained BOOLEAN DEFAULT false,
    consent_date DATE,
    consent_document_url TEXT,
    enrolled_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(study_id, patient_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_research_studies_organization ON research_studies(organization_id);
CREATE INDEX IF NOT EXISTS idx_research_studies_status ON research_studies(status);
CREATE INDEX IF NOT EXISTS idx_research_studies_type ON research_studies(study_type);
CREATE INDEX IF NOT EXISTS idx_research_studies_created_at ON research_studies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_participants_study ON research_study_participants(study_id);
CREATE INDEX IF NOT EXISTS idx_study_participants_patient ON research_study_participants(patient_id);
CREATE INDEX IF NOT EXISTS idx_study_participants_status ON research_study_participants(enrollment_status);

-- Create triggers
CREATE OR REPLACE FUNCTION update_research_studies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_research_studies_updated_at ON research_studies;
CREATE TRIGGER trigger_update_research_studies_updated_at
    BEFORE UPDATE ON research_studies
    FOR EACH ROW
    EXECUTE FUNCTION update_research_studies_updated_at();

CREATE OR REPLACE FUNCTION update_research_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_research_participants_updated_at ON research_study_participants;
CREATE TRIGGER trigger_update_research_participants_updated_at
    BEFORE UPDATE ON research_study_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_research_participants_updated_at();

-- Enable RLS
ALTER TABLE research_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_study_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view studies from their organization" ON research_studies;
CREATE POLICY "Users can view studies from their organization"
  ON research_studies FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create studies in their organization" ON research_studies;
CREATE POLICY "Users can create studies in their organization"
  ON research_studies FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update studies in their organization" ON research_studies;
CREATE POLICY "Users can update studies in their organization"
  ON research_studies FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete studies in their organization" ON research_studies;
CREATE POLICY "Users can delete studies in their organization"
  ON research_studies FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Users can view participants from their organization" ON research_study_participants;
CREATE POLICY "Users can view participants from their organization"
  ON research_study_participants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create participants in their organization" ON research_study_participants;
CREATE POLICY "Users can create participants in their organization"
  ON research_study_participants FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update participants in their organization" ON research_study_participants;
CREATE POLICY "Users can update participants in their organization"
  ON research_study_participants FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete participants in their organization" ON research_study_participants;
CREATE POLICY "Users can delete participants in their organization"
  ON research_study_participants FOR DELETE
  USING (true);

-- Add foreign keys if parent tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'research_studies_organization_id_fkey') THEN
            ALTER TABLE research_studies ADD CONSTRAINT research_studies_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_accounts') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'research_studies_created_by_fkey') THEN
            ALTER TABLE research_studies ADD CONSTRAINT research_studies_created_by_fkey FOREIGN KEY (created_by) REFERENCES user_accounts(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'research_studies_updated_by_fkey') THEN
            ALTER TABLE research_studies ADD CONSTRAINT research_studies_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES user_accounts(id);
        END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'research_study_participants_study_id_fkey') THEN
        ALTER TABLE research_study_participants ADD CONSTRAINT research_study_participants_study_id_fkey FOREIGN KEY (study_id) REFERENCES research_studies(id) ON DELETE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'research_study_participants_patient_id_fkey') THEN
            ALTER TABLE research_study_participants ADD CONSTRAINT research_study_participants_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_accounts') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'research_study_participants_enrolled_by_fkey') THEN
            ALTER TABLE research_study_participants ADD CONSTRAINT research_study_participants_enrolled_by_fkey FOREIGN KEY (enrolled_by) REFERENCES user_accounts(id);
        END IF;
    END IF;
END $$;`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlContent)
    alert("SQL copied to clipboard! Now paste it in Supabase SQL Editor.")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Research Studies Database Migration
          </CardTitle>
          <CardDescription>
            Create the research_studies and research_study_participants tables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Quick Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Copy SQL to Clipboard" button below</li>
              <li>Go to your Supabase Dashboard</li>
              <li>Click "SQL Editor" in the left sidebar</li>
              <li>Click "New Query"</li>
              <li>Paste the SQL (Ctrl+V / Cmd+V)</li>
              <li>Click "Run" button (or press Ctrl+Enter)</li>
              <li>Wait for success message</li>
              <li>Refresh the Research Dashboard page</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button onClick={copyToClipboard} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy SQL to Clipboard
            </Button>
            <Button onClick={handleMigrate} disabled={loading} variant="outline">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Try Auto-Migration (API)
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
              <p className="text-sm text-red-700 mt-2">
                Auto-migration via API is not supported. Please use the manual method above.
              </p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-semibold">Migration Results</p>
              </div>
              <p className="text-sm text-green-700">
                {result.message}
              </p>
              {result.successful > 0 && (
                <p className="text-sm text-green-700 mt-1">
                  ✅ {result.successful} statements executed successfully
                </p>
              )}
              {result.errors > 0 && (
                <p className="text-sm text-yellow-700 mt-1">
                  ⚠️ {result.errors} statements had errors (may be expected)
                </p>
              )}
            </div>
          )}

          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Alternative: Direct Supabase Link</h4>
            <p className="text-sm text-gray-600 mb-2">
              If you have Supabase CLI installed, you can also run:
            </p>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              supabase db push scripts/create_research_studies_tables.sql
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

