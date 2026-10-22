ALTER TABLE public.atleti DROP CONSTRAINT atleti_ifma_division_valid;
ALTER TABLE public.atleti ADD CONSTRAINT atleti_ifma_division_valid CHECK (
  categoria_peso IS NULL OR categoria_peso = ANY (ARRAY[
    '-24 kg', '-28 kg', '-30 kg', '-32 kg', '-34 kg', '-36 kg', '-37 kg', '-38 kg', '-40 kg', '-42 kg', '-44 kg', '-45 kg', '-46 kg', '-47 kg', '-48 kg', '-50 kg', '-51 kg', '-52 kg', '-54 kg', '-55 kg', '-56 kg', '-57 kg', '-58 kg', '-60 kg', '-63 kg', '-63.5 kg', '-65 kg', '-67 kg', '-69 kg', '-71 kg', '-75 kg', '-81 kg', '-86 kg', '-91 kg',
    '+60 kg', '+63.5 kg', '+67 kg', '+71 kg', '+75 kg', '+81 kg', '+91 kg'
  ]::text[])
) NOT VALID;
COMMENT ON CONSTRAINT atleti_ifma_division_valid ON public.atleti IS 'Accepts all current Gioco Sport, Young Cadet, Older Cadet, Junior and Senior weight labels; legacy accepted labels are preserved. Age-specific division choices remain in roster logic, with event divisions calculated separately.';