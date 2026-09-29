ALTER TABLE public.atleti ADD COLUMN IF NOT EXISTS formato text NOT NULL DEFAULT 'KO';
ALTER TABLE public.atleti ADD CONSTRAINT atleti_formato_check CHECK (formato IN ('KO','Light'));