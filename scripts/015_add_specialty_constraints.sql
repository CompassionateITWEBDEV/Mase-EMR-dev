-- ============================================================================
-- ADD UNIQUE CONSTRAINTS TO SPECIALTY TABLES
-- Phase 5 supplemental migration
-- ============================================================================
-- Adds unique constraints needed for idempotent seeding
-- ============================================================================

-- Add unique constraint on specialty_features if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'specialty_features_specialty_feature_unique'
    ) THEN
        ALTER TABLE specialty_features 
        ADD CONSTRAINT specialty_features_specialty_feature_unique 
        UNIQUE (specialty_id, feature_code);
        
        RAISE NOTICE 'Added unique constraint to specialty_features';
    ELSE
        RAISE NOTICE 'Unique constraint on specialty_features already exists';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint already exists (duplicate_object)';
    WHEN others THEN
        RAISE NOTICE 'Could not add constraint: %', SQLERRM;
END $$;

-- Add unique constraint on clinic_specialty_configuration if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clinic_specialty_config_unique'
    ) THEN
        -- For now, we ensure uniqueness per specialty when clinic_id is null
        -- In multi-tenant scenarios, uniqueness would be (clinic_id, specialty_id)
        CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_specialty_config_unique
        ON clinic_specialty_configuration(specialty_id)
        WHERE clinic_id IS NULL;
        
        RAISE NOTICE 'Added partial unique index to clinic_specialty_configuration';
    ELSE
        RAISE NOTICE 'Unique constraint on clinic_specialty_configuration already exists';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Index already exists (duplicate_object)';
    WHEN others THEN
        RAISE NOTICE 'Could not add index: %', SQLERRM;
END $$;

-- Final completion notice
DO $$
BEGIN
    RAISE NOTICE 'Specialty constraints migration complete';
END $$;

