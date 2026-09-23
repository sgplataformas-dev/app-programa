
CREATE OR REPLACE FUNCTION public.wa_active_customers()
RETURNS TABLE(email text, user_id uuid, nome text, telefone text, last_purchase timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH p AS (
    SELECT
      lower(trim(pu.email)) AS email,
      pu.user_id,
      lower(coalesce(pu.payment_status, '')) AS st,
      coalesce(pu.updated_at, pu.purchase_date, pu.created_at) AS ts,
      (coalesce(pu.payt_order_id,'') ILIKE 'legacy-%' OR lower(coalesce(pu.payment_status,'')) = 'imported') AS legacy,
      pu.raw_payload
    FROM public.purchases pu
    WHERE pu.email IS NOT NULL AND trim(pu.email) <> ''
  ),
  agg AS (
    SELECT
      p.email,
      (array_agg(p.user_id) FILTER (WHERE p.user_id IS NOT NULL))[1] AS user_id,
      max(p.ts) AS last_purchase,
      max(p.ts) FILTER (WHERE NOT p.legacy AND p.st IN ('refunded','refund','chargeback','charged_back','reversed','disputed')) AS last_refund,
      max(p.ts) FILTER (WHERE NOT p.legacy AND p.st NOT IN ('refunded','refund','chargeback','charged_back','reversed','disputed','canceled','cancelled')) AS last_active_real,
      bool_or(p.st NOT IN ('refunded','refund','chargeback','charged_back','reversed','disputed','canceled','cancelled')) AS any_active,
      (array_agg(p.raw_payload->'customer'->>'phone' ORDER BY p.ts DESC)
        FILTER (WHERE p.raw_payload->'customer'->>'phone' IS NOT NULL))[1] AS payload_phone
    FROM p
    GROUP BY p.email
  )
  SELECT
    a.email,
    a.user_id,
    coalesce(nullif(trim(pr.nome), ''), '') AS nome,
    coalesce(nullif(trim(pr.telefone), ''), a.payload_phone) AS telefone,
    a.last_purchase
  FROM agg a
  LEFT JOIN public.profiles pr ON pr.id = a.user_id
  LEFT JOIN auth.users au ON au.id = a.user_id
  WHERE (
      CASE WHEN a.last_refund IS NULL THEN a.any_active
           ELSE coalesce(a.last_active_real, '-infinity'::timestamptz) > a.last_refund END
    )
    AND (au.banned_until IS NULL OR au.banned_until < now())
$$;

REVOKE ALL ON FUNCTION public.wa_active_customers() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wa_active_customers() TO service_role;

CREATE OR REPLACE FUNCTION public.wa_low_engagement(_total_lessons integer, _max_pct numeric)
RETURNS TABLE(email text, nome text, telefone text, last_purchase timestamptz, aulas integer, pct numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.email,
    c.nome,
    c.telefone,
    c.last_purchase,
    coalesce(lp.n, 0)::int AS aulas,
    round((coalesce(lp.n, 0)::numeric * 100) / greatest(_total_lessons, 1), 1) AS pct
  FROM public.wa_active_customers() c
  LEFT JOIN (
    SELECT user_id, count(DISTINCT lesson_id) AS n
    FROM public.lesson_progress
    GROUP BY user_id
  ) lp ON lp.user_id = c.user_id
  WHERE (coalesce(lp.n, 0)::numeric * 100) / greatest(_total_lessons, 1) <= _max_pct
  ORDER BY c.last_purchase DESC NULLS LAST
$$;

REVOKE ALL ON FUNCTION public.wa_low_engagement(integer, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wa_low_engagement(integer, numeric) TO service_role;

CREATE OR REPLACE FUNCTION public.wa_buyers_period(_from timestamptz, _to timestamptz, _total_lessons integer)
RETURNS TABLE(email text, nome text, telefone text, last_purchase timestamptz, aulas integer, pct numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.email,
    c.nome,
    c.telefone,
    c.last_purchase,
    coalesce(lp.n, 0)::int AS aulas,
    round((coalesce(lp.n, 0)::numeric * 100) / greatest(_total_lessons, 1), 1) AS pct
  FROM public.wa_active_customers() c
  LEFT JOIN (
    SELECT user_id, count(DISTINCT lesson_id) AS n
    FROM public.lesson_progress
    GROUP BY user_id
  ) lp ON lp.user_id = c.user_id
  WHERE c.last_purchase >= _from AND c.last_purchase < _to
  ORDER BY c.last_purchase DESC
$$;

REVOKE ALL ON FUNCTION public.wa_buyers_period(timestamptz, timestamptz, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wa_buyers_period(timestamptz, timestamptz, integer) TO service_role;
