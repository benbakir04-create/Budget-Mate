-- وازن: تشديد الدوال المساعدة بعد فحص الأمان في Supabase (18 نوفمبر 2026).
-- لا يغيّر سلوك التطبيق: دوال المال تستدعي هذه المساعدات من داخلها بصلاحية مالكها.

-- 1) مسار بحث ثابت لكل الدوال، كما تشترط المنهجية.
alter function public.fail(text) set search_path = '';
alter function public.fund_effect(text, numeric) set search_path = '';

-- 2) المساعدات الداخلية لا تُستدعى من المتصفح عبر /rest/v1/rpc.
revoke execute on function public.require_owner() from authenticated;
revoke execute on function public.fail(text) from authenticated;
revoke execute on function public.fund_effect(text, numeric) from authenticated;

-- 3) صلاحيات الجداول صريحة، فلا تعتمد على خيار «Automatically expose new tables» في Supabase.
--    RLS يبقى هو الحارس: هذه المنح تفتح الباب، والسياسات تحدد الصفوف.
grant select on public.profiles, public.partner_invites, public.funds, public.categories,
                public.transactions, public.orders, public.budgets, public.audit_log
   to authenticated;
grant insert, update, delete on public.partner_invites, public.categories, public.budgets
   to authenticated;
grant insert on public.orders to authenticated;
