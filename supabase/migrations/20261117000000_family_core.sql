-- وازن، المسار العائلي: المخطط والصلاحيات (منهجية ركيزة، ADR 0005).
-- كل قاعدة BR-xx في docs/FUNCTIONAL_INVENTORY.md مفروضة هنا، ولكل واحدة فحص في
-- supabase/tests/schema.test.mjs.
--
-- «الشبكة» هي المالك وشركاؤه. كل صف يحمل owner_id، أي مالك شبكته.
-- المتصفح لا يكتب المال مباشرة: الرصيد والعمليات وحالات الطلبيات تتغير فقط عبر دوال
-- security definer، وهي تتحقق من الصلاحية وتكتب سجل التدقيق.

create extension if not exists pgcrypto;

-- ============================================================================
-- الجداول
-- ============================================================================

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '' check (char_length(name) <= 100),
  role        text not null check (role in ('owner', 'partner')),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  currency    text not null default 'DZD' check (currency in ('DZD', 'EUR', 'USD')),
  language    text not null default 'ar' check (language in ('ar', 'fr', 'en')),
  created_at  timestamptz not null default now(),
  -- المالك هو مالك شبكته؛ الشريك يتبع مالكًا آخر.
  check ((role = 'owner') = (owner_id = id))
);

-- دعوة شريك: يكتبها المالك، ويستهلكها التسجيل بالبريد نفسه (Q-04).
create table public.partner_invites (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  email       text not null check (email = lower(btrim(email)) and email like '%@%'),
  created_at  timestamptz not null default now(),
  unique (email)
);

create table public.funds (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 80),
  balance      numeric(12, 2) not null default 0,
  archived_at  timestamptz,
  created_at   timestamptz not null default now()
);

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  name_ar     text not null check (char_length(btrim(name_ar)) between 1 and 60),
  icon        text not null default '📦',
  color       text not null default '#6B7280' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  type        text not null check (type in ('income', 'expense', 'transfer')),
  is_private  boolean not null default false,
  -- قسم «تمويل الصندوق» يُنشئه النظام: لا يُعدَّل ولا يُحذف (BR-11).
  is_system   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (owner_id, name),                                    -- BR-13
  check (type <> 'transfer' or is_system)                     -- لا ينشئ أحد قسم تحويل بيده
);

create table public.transactions (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  amount       numeric(12, 2) not null check (amount > 0),
  type         text not null check (type in ('income', 'expense', 'transfer')),
  description  text not null default '' check (char_length(description) <= 300),
  date         timestamptz not null default now(),
  -- restrict: القسم المستعمل لا يُحذف (BR-12)، والصندوق الذي فيه حركة لا يُحذف بل يؤرشف (Q-06).
  category_id  uuid not null references public.categories (id) on delete restrict,
  fund_id      uuid references public.funds (id) on delete restrict,
  created_at   timestamptz not null default now(),
  -- على الصندوق: مصاريف وتمويل فقط، والتمويل دائمًا على صندوق (BR-14، BR-17).
  check (fund_id is not null or type <> 'transfer'),
  check (fund_id is null or type in ('expense', 'transfer'))
);
create index transactions_owner_date_idx on public.transactions (owner_id, date desc);
create index transactions_fund_idx on public.transactions (fund_id) where fund_id is not null;

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles (id) on delete cascade,
  fund_id         uuid not null references public.funds (id) on delete restrict,
  title           text not null check (char_length(btrim(title)) between 1 and 120),
  est_amount      numeric(12, 2) not null check (est_amount > 0),
  status          text not null default 'pending_approval'
                  check (status in ('pending_approval', 'approved', 'purchased')),
  requested_by    uuid not null references public.profiles (id) on delete cascade,
  transaction_id  uuid references public.transactions (id) on delete set null,
  created_at      timestamptz not null default now()
);

create table public.budgets (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  category_id  uuid not null references public.categories (id) on delete cascade,
  amount       numeric(12, 2) not null check (amount > 0),
  period       text not null default 'monthly' check (period in ('monthly', 'weekly', 'yearly')),
  start_date   date not null,
  end_date     date not null check (end_date >= start_date),
  created_at   timestamptz not null default now(),
  unique (owner_id, category_id, start_date)
);

-- سجل التدقيق (BR-31): يُكتب من دوال المال فقط، ولا يُعدَّل ولا يُحذف.
create table public.audit_log (
  id         bigint generated always as identity primary key,
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  actor_id   uuid not null references public.profiles (id) on delete cascade,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  before     jsonb,
  after      jsonb,
  at         timestamptz not null default now()
);
create index audit_log_owner_at_idx on public.audit_log (owner_id, at desc);

-- ============================================================================
-- دوال مساعدة للصلاحيات (تقرأ profiles متجاوزة RLS، فلا تدور في حلقة)
-- ============================================================================

create function public.my_owner_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.owner_id from public.profiles p where p.id = auth.uid()
$$;

create function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.role = 'owner' from public.profiles p where p.id = auth.uid()), false)
$$;

-- ============================================================================
-- التسجيل: الدور من app_metadata لا من بيانات يكتبها المستخدم (BR-32)
-- ============================================================================

-- قبل الإدراج: من له دعوة صار شريكًا لمن دعاه، وغيره مالك. تُكتب النتيجة في
-- app_metadata فتصل في رمز الدخول، وأي role أرسله المستخدم في user_metadata يُهمل.
create function public.assign_role_on_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
begin
  select i.owner_id into v_owner
    from public.partner_invites i
   where i.email = lower(btrim(new.email));

  new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb)
    || case when v_owner is null
            then jsonb_build_object('role', 'owner', 'owner_id', new.id)
            else jsonb_build_object('role', 'partner', 'owner_id', v_owner) end;
  return new;
end $$;

-- بعد الإدراج: الملف الشخصي، والأقسام الافتراضية للمالك الجديد (BR-10).
create function public.create_profile_on_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_role  text := new.raw_app_meta_data ->> 'role';
  v_owner uuid := (new.raw_app_meta_data ->> 'owner_id')::uuid;
begin
  insert into public.profiles (id, name, role, owner_id)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), v_role, v_owner);

  if v_role = 'partner' then
    delete from public.partner_invites where email = lower(btrim(new.email));
  else
    insert into public.categories (owner_id, name, name_ar, icon, color, type) values
      (new.id, 'Groceries',         'السوق والخضر',        '🥬', '#22C55E', 'expense'),
      (new.id, 'Bread & Milk',      'الخبز والحليب',       '🥖', '#F59E0B', 'expense'),
      (new.id, 'Rent',              'الكراء',              '🏠', '#8B5CF6', 'expense'),
      (new.id, 'Electricity & Gas', 'الكهرباء والغاز',     '💡', '#3B82F6', 'expense'),
      (new.id, 'Water',             'الماء',               '🚰', '#06B6D4', 'expense'),
      (new.id, 'Internet & Phone',  'الإنترنت والهاتف',    '📶', '#6366F1', 'expense'),
      (new.id, 'Transport',         'النقل والوقود',       '🚗', '#F97316', 'expense'),
      (new.id, 'School',            'المدرسة والدروس',     '📚', '#0EA5E9', 'expense'),
      (new.id, 'Health',            'الصحة والدواء',       '💊', '#10B981', 'expense'),
      (new.id, 'Clothing',          'الملابس',             '👕', '#EC4899', 'expense'),
      (new.id, 'Ramadan',           'رمضان',               '🌙', '#A855F7', 'expense'),
      (new.id, 'Occasions',         'الأعياد والمناسبات',  '🎉', '#EF4444', 'expense'),
      (new.id, 'Other Expense',     'مصروف آخر',           '📦', '#6B7280', 'expense'),
      (new.id, 'Salary',            'الراتب',              '💰', '#10B981', 'income'),
      (new.id, 'Trade',             'تجارة وعمل حر',       '💼', '#3B82F6', 'income'),
      (new.id, 'Other Income',      'دخل آخر',             '💵', '#6B7280', 'income');
  end if;
  return new;
end $$;

create trigger assign_role_on_signup before insert on auth.users
  for each row execute function public.assign_role_on_signup();
create trigger create_profile_on_signup after insert on auth.users
  for each row execute function public.create_profile_on_signup();

-- ============================================================================
-- الصلاحيات المباشرة (RLS): القراءة داخل الشبكة، والكتابة المسموحة فقط
-- ============================================================================

alter table public.profiles        enable row level security;
alter table public.partner_invites enable row level security;
alter table public.funds           enable row level security;
alter table public.categories      enable row level security;
alter table public.transactions    enable row level security;
alter table public.orders          enable row level security;
alter table public.budgets         enable row level security;
alter table public.audit_log       enable row level security;

-- لا شيء للزائر غير المسجّل.
revoke all on all tables in schema public from anon;
-- المال لا يُكتب مباشرة: الإدراج والتعديل والحذف على هذه الجداول عبر الدوال فقط.
revoke insert, update, delete on public.transactions, public.audit_log from authenticated;
revoke insert, update, delete on public.profiles from authenticated;
revoke insert, update, delete on public.funds from authenticated;
revoke update, delete on public.orders from authenticated;
-- ما يجوز تعديله مباشرة، عمودًا عمودًا.
grant update (name, currency, language) on public.profiles to authenticated;
grant update (name, archived_at) on public.funds to authenticated;

-- الملف الشخصي: أرى نفسي وأفراد شبكتي، وأعدّل نفسي فقط.
create policy profiles_read on public.profiles for select to authenticated
  using (owner_id = public.my_owner_id());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- الدعوات: المالك وحده (BR-08).
create policy invites_owner on public.partner_invites for all to authenticated
  using (owner_id = auth.uid() and public.is_owner())
  with check (owner_id = auth.uid() and public.is_owner());

-- الصناديق: الشبكة تقرأ، والمالك وحده يعيد التسمية أو يؤرشف (BR-05). لا حذف (Q-06).
create policy funds_read on public.funds for select to authenticated
  using (owner_id = public.my_owner_id());
create policy funds_owner_update on public.funds for update to authenticated
  using (owner_id = auth.uid() and public.is_owner())
  with check (owner_id = auth.uid());

-- الأقسام: الشريك لا يرى الخاص (BR-02)، والمالك وحده يدير (BR-06)، وقسم النظام لا يُمس (BR-11).
create policy categories_read on public.categories for select to authenticated
  using (owner_id = public.my_owner_id() and (public.is_owner() or not is_private));
create policy categories_owner_insert on public.categories for insert to authenticated
  with check (owner_id = auth.uid() and public.is_owner() and not is_system);
create policy categories_owner_update on public.categories for update to authenticated
  using (owner_id = auth.uid() and public.is_owner() and not is_system)
  with check (owner_id = auth.uid() and not is_system and type <> 'transfer');
create policy categories_owner_delete on public.categories for delete to authenticated
  using (owner_id = auth.uid() and public.is_owner() and not is_system);

-- العمليات: المالك يرى شبكته كلها؛ الشريك يرى عملياته وعمليات الصناديق، في غير الخاص (BR-03، BR-04).
create policy transactions_read on public.transactions for select to authenticated
  using (
    owner_id = public.my_owner_id()
    and (
      public.is_owner()
      or (
        (user_id = auth.uid() or fund_id is not null)
        and exists (select 1 from public.categories c
                     where c.id = category_id and not c.is_private)
      )
    )
  );

-- الطلبيات: الشبكة تقرأ، وأي عضو يرفع طلبية معلّقة على صندوق نشط من صناديق شبكته (BR-09).
create policy orders_read on public.orders for select to authenticated
  using (owner_id = public.my_owner_id());
create policy orders_member_insert on public.orders for insert to authenticated
  with check (
    owner_id = public.my_owner_id()
    and requested_by = auth.uid()
    and status = 'pending_approval'
    and transaction_id is null
    and exists (select 1 from public.funds f
                 where f.id = orders.fund_id and f.owner_id = orders.owner_id
                   and f.archived_at is null)
  );

-- الميزانيات: الشريك لا يرى ميزانية قسم خاص، والمالك وحده يدير (BR-06).
create policy budgets_read on public.budgets for select to authenticated
  using (
    owner_id = public.my_owner_id()
    and (public.is_owner()
         or exists (select 1 from public.categories c where c.id = category_id and not c.is_private))
  );
create policy budgets_owner_write on public.budgets for all to authenticated
  using (owner_id = auth.uid() and public.is_owner())
  with check (
    owner_id = auth.uid() and public.is_owner()
    and exists (select 1 from public.categories c
                 where c.id = category_id and c.owner_id = auth.uid() and c.type = 'expense')
  );

-- سجل التدقيق: المالك وحده يقرأ سجل شبكته.
create policy audit_owner_read on public.audit_log for select to authenticated
  using (owner_id = auth.uid() and public.is_owner());

-- ============================================================================
-- دوال المال (كل واحدة معاملة واحدة: كل شيء أو لا شيء)
-- ============================================================================

create function public.audit(p_owner uuid, p_action text, p_entity text, p_entity_id uuid,
                             p_before jsonb, p_after jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (owner_id, actor_id, action, entity, entity_id, before, after)
  values (p_owner, auth.uid(), p_action, p_entity, p_entity_id, p_before, p_after)
$$;

-- يرمي خطأ برمز مفهوم تترجمه الواجهة إلى رسالة عربية.
create function public.fail(p_code text) returns void
language plpgsql as $$ begin raise exception '%', p_code using errcode = 'P0001'; end $$;

create function public.require_owner() returns uuid
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_owner() then perform public.fail('FORBIDDEN_OWNER_ONLY'); end if;
  return auth.uid();
end $$;

-- قسم «تمويل الصندوق» للمالك، يُنشأ عند أول تمويل (BR-11).
create function public.funding_category(p_owner uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  select id into v_id from public.categories where owner_id = p_owner and name = 'Funding';
  if v_id is null then
    insert into public.categories (owner_id, name, name_ar, icon, color, type, is_system)
    values (p_owner, 'Funding', 'تمويل الصندوق', '💳', '#1D9E75', 'transfer', true)
    returning id into v_id;
  end if;
  return v_id;
end $$;

-- تمويل صندوق من المالك (BR-15): يرفع الرصيد ويسجّل transfer.
create function public.deposit_to_fund(p_fund_id uuid, p_amount numeric, p_description text default '')
returns public.funds
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := public.require_owner();
  v_fund  public.funds;
  v_tx    uuid;
begin
  if p_amount is null or p_amount <= 0 then perform public.fail('INVALID_AMOUNT'); end if;
  select * into v_fund from public.funds where id = p_fund_id and owner_id = v_owner for update;
  if v_fund.id is null then perform public.fail('INVALID_FUND'); end if;
  if v_fund.archived_at is not null then perform public.fail('FUND_ARCHIVED'); end if;

  insert into public.transactions (owner_id, user_id, amount, type, description, category_id, fund_id)
  values (v_owner, v_owner, p_amount, 'transfer', coalesce(p_description, ''),
          public.funding_category(v_owner), p_fund_id)
  returning id into v_tx;

  update public.funds set balance = balance + p_amount where id = p_fund_id returning * into v_fund;
  perform public.audit(v_owner, 'deposit', 'fund', p_fund_id,
                       jsonb_build_object('balance', v_fund.balance - p_amount),
                       jsonb_build_object('balance', v_fund.balance, 'transaction_id', v_tx));
  return v_fund;
end $$;

-- صندوق جديد برصيد افتتاحي اختياري، يُسجَّل تمويلًا في المعاملة نفسها (BR-16).
create function public.create_fund(p_name text, p_initial_balance numeric default 0)
returns public.funds
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := public.require_owner();
  v_fund  public.funds;
begin
  if coalesce(p_initial_balance, 0) < 0 then perform public.fail('INVALID_AMOUNT'); end if;
  insert into public.funds (owner_id, name) values (v_owner, p_name) returning * into v_fund;
  perform public.audit(v_owner, 'create', 'fund', v_fund.id, null, to_jsonb(v_fund));
  if coalesce(p_initial_balance, 0) > 0 then
    v_fund := public.deposit_to_fund(v_fund.id, p_initial_balance, 'رصيد افتتاحي');
  end if;
  return v_fund;
end $$;

-- تسجيل عملية دخل أو مصروف (BR-14، BR-17 إلى BR-21). الصندوق قد ينزل تحت الصفر (Q-05).
create function public.record_transaction(
  p_amount numeric, p_type text, p_category_id uuid,
  p_fund_id uuid default null, p_description text default '', p_date timestamptz default null)
returns public.transactions
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := public.my_owner_id();
  v_cat   public.categories;
  v_fund  public.funds;
  v_tx    public.transactions;
begin
  if v_owner is null then perform public.fail('AUTHENTICATION_REQUIRED'); end if;
  if p_type not in ('income', 'expense') then perform public.fail('INVALID_TYPE'); end if;
  if p_amount is null or p_amount <= 0 then perform public.fail('INVALID_AMOUNT'); end if;
  if p_fund_id is not null and p_type <> 'expense' then perform public.fail('FUND_EXPENSE_ONLY'); end if;

  select * into v_cat from public.categories where id = p_category_id and owner_id = v_owner;
  if v_cat.id is null or v_cat.type <> p_type then perform public.fail('INVALID_CATEGORY'); end if;
  if v_cat.is_private and not public.is_owner() then perform public.fail('FORBIDDEN_PRIVATE_CATEGORY'); end if;

  if p_fund_id is not null then
    select * into v_fund from public.funds where id = p_fund_id and owner_id = v_owner for update;
    if v_fund.id is null then perform public.fail('INVALID_FUND'); end if;
    if v_fund.archived_at is not null then perform public.fail('FUND_ARCHIVED'); end if;
    update public.funds set balance = balance - p_amount where id = p_fund_id;
  end if;

  insert into public.transactions (owner_id, user_id, amount, type, description, date, category_id, fund_id)
  values (v_owner, auth.uid(), p_amount, p_type, coalesce(p_description, ''),
          coalesce(p_date, now()), p_category_id, p_fund_id)
  returning * into v_tx;
  perform public.audit(v_owner, 'create', 'transaction', v_tx.id, null, to_jsonb(v_tx));
  return v_tx;
end $$;

-- أثر عملية على رصيد صندوقها: المصروف يُنقص والتمويل يزيد.
create function public.fund_effect(p_type text, p_amount numeric) returns numeric
language sql immutable as $$
  select case p_type when 'expense' then -p_amount when 'transfer' then p_amount else 0 end
$$;

-- تعديل عملية: للمالك وحده (Q-03). يُرجع الأثر القديم ثم يطبّق الجديد (BR-22).
-- النوع لا يتغير إلى تمويل أو منه، فالتمويل يُصحَّح بحذفه وإعادته.
create function public.update_transaction(
  p_id uuid, p_amount numeric, p_category_id uuid, p_fund_id uuid,
  p_description text, p_date timestamptz)
returns public.transactions
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := public.require_owner();
  v_old   public.transactions;
  v_new   public.transactions;
  v_cat   public.categories;
begin
  select * into v_old from public.transactions where id = p_id and owner_id = v_owner for update;
  if v_old.id is null then perform public.fail('NOT_FOUND'); end if;
  if p_amount is null or p_amount <= 0 then perform public.fail('INVALID_AMOUNT'); end if;

  select * into v_cat from public.categories where id = p_category_id and owner_id = v_owner;
  if v_cat.id is null or v_cat.type <> v_old.type then perform public.fail('INVALID_CATEGORY'); end if;
  if v_old.type = 'transfer' and p_fund_id is distinct from v_old.fund_id then
    perform public.fail('TRANSFER_FUND_FIXED');
  end if;
  if p_fund_id is not null and v_old.type = 'income' then perform public.fail('FUND_EXPENSE_ONLY'); end if;
  if p_fund_id is not null and p_fund_id is distinct from v_old.fund_id
     and not exists (select 1 from public.funds where id = p_fund_id and owner_id = v_owner
                       and archived_at is null) then
    perform public.fail('INVALID_FUND');
  end if;

  if v_old.fund_id is not null then
    update public.funds set balance = balance - public.fund_effect(v_old.type, v_old.amount)
     where id = v_old.fund_id;
  end if;
  if p_fund_id is not null then
    update public.funds set balance = balance + public.fund_effect(v_old.type, p_amount)
     where id = p_fund_id;
  end if;

  update public.transactions
     set amount = p_amount, category_id = p_category_id, fund_id = p_fund_id,
         description = coalesce(p_description, ''), date = coalesce(p_date, v_old.date)
   where id = p_id
  returning * into v_new;
  perform public.audit(v_owner, 'update', 'transaction', p_id, to_jsonb(v_old), to_jsonb(v_new));
  return v_new;
end $$;

-- حذف عملية: للمالك وحده (Q-03)، ويُرجع أثرها على الرصيد (BR-22).
create function public.delete_transaction(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := public.require_owner();
  v_old   public.transactions;
begin
  select * into v_old from public.transactions where id = p_id and owner_id = v_owner for update;
  if v_old.id is null then perform public.fail('NOT_FOUND'); end if;
  if v_old.fund_id is not null then
    update public.funds set balance = balance - public.fund_effect(v_old.type, v_old.amount)
     where id = v_old.fund_id;
  end if;
  update public.orders set transaction_id = null where transaction_id = p_id;
  delete from public.transactions where id = p_id;
  perform public.audit(v_owner, 'delete', 'transaction', p_id, to_jsonb(v_old), null);
end $$;

-- اعتماد طلبية معلّقة: للمالك وحده (BR-07، BR-26).
create function public.approve_order(p_id uuid) returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := public.require_owner();
  v_order public.orders;
begin
  update public.orders set status = 'approved'
   where id = p_id and owner_id = v_owner and status = 'pending_approval'
  returning * into v_order;
  if v_order.id is null then perform public.fail('ORDER_NOT_PENDING'); end if;
  perform public.audit(v_owner, 'approve', 'order', p_id, null, to_jsonb(v_order));
  return v_order;
end $$;

-- شراء طلبية (BR-23 إلى BR-27): خصم واحد ولو تسابقت نقرتان.
create function public.purchase_order(
  p_id uuid, p_category_id uuid, p_actual_amount numeric default null, p_description text default null)
returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_owner  uuid := public.my_owner_id();
  v_order  public.orders;
  v_cat    public.categories;
  v_amount numeric;
  v_tx     uuid;
begin
  if v_owner is null then perform public.fail('AUTHENTICATION_REQUIRED'); end if;
  -- القفل على الصف يجعل النقرة الثانية تنتظر ثم ترى «مشتراة».
  select * into v_order from public.orders where id = p_id and owner_id = v_owner for update;
  if v_order.id is null then perform public.fail('NOT_FOUND'); end if;
  if v_order.status = 'purchased' then perform public.fail('ORDER_ALREADY_PURCHASED'); end if;
  if v_order.status <> 'approved' and not public.is_owner() then perform public.fail('ORDER_NOT_APPROVED'); end if;

  select * into v_cat from public.categories where id = p_category_id and owner_id = v_owner;
  if v_cat.id is null or v_cat.type <> 'expense' then perform public.fail('INVALID_CATEGORY'); end if;
  if v_cat.is_private and not public.is_owner() then perform public.fail('FORBIDDEN_PRIVATE_CATEGORY'); end if;

  v_amount := coalesce(p_actual_amount, v_order.est_amount);
  if v_amount <= 0 then perform public.fail('INVALID_AMOUNT'); end if;

  insert into public.transactions (owner_id, user_id, amount, type, description, category_id, fund_id)
  values (v_owner, auth.uid(), v_amount, 'expense',
          coalesce(p_description, 'شراء طلب: ' || v_order.title), p_category_id, v_order.fund_id)
  returning id into v_tx;
  update public.funds set balance = balance - v_amount where id = v_order.fund_id;
  update public.orders set status = 'purchased', transaction_id = v_tx where id = p_id
  returning * into v_order;
  perform public.audit(v_owner, 'purchase', 'order', p_id, null,
                       jsonb_build_object('amount', v_amount, 'transaction_id', v_tx));
  return v_order;
end $$;

-- ============================================================================
-- قراءات محسوبة (بصلاحيات المستدعي)
-- ============================================================================

-- الملخص (BR-28): دخل ومصروف فقط، بلا تمويل، وما يراه المستدعي وحده.
create function public.transaction_summary(p_from timestamptz, p_to timestamptz, p_fund_id uuid default null)
returns jsonb
language sql stable security invoker set search_path = '' as $$
  with t as (
    select type, amount, category_id from public.transactions
     where date >= p_from and date < p_to
       and (p_fund_id is null or fund_id = p_fund_id)
       and type in ('income', 'expense')
  )
  select jsonb_build_object(
    'income',  coalesce(sum(amount) filter (where type = 'income'), 0),
    'expense', coalesce(sum(amount) filter (where type = 'expense'), 0),
    'count',   count(*),
    'expense_by_category', coalesce((
       select jsonb_agg(jsonb_build_object('category_id', category_id, 'total', total) order by total desc)
         from (select category_id, sum(amount) as total from t where type = 'expense'
               group by category_id) g), '[]'::jsonb))
  from t
$$;

-- المصروف المحسوب لكل ميزانية يراها المستدعي (BR-29): كل مصاريف الشبكة في القسم والفترة،
-- ولو لم يرَ الشريك بعضها (مصاريف المالك الشخصية)، دون كشف تفاصيلها.
create function public.budgets_with_spent()
returns table (budget_id uuid, category_id uuid, amount numeric, period text,
               start_date date, end_date date, spent numeric)
language sql stable security definer set search_path = '' as $$
  select b.id, b.category_id, b.amount, b.period, b.start_date, b.end_date,
         coalesce((select sum(t.amount) from public.transactions t
                    where t.owner_id = b.owner_id and t.category_id = b.category_id
                      and t.type = 'expense'
                      and t.date >= b.start_date and t.date < b.end_date + 1), 0)
    from public.budgets b
    join public.categories c on c.id = b.category_id
   where b.owner_id = public.my_owner_id()
     and (public.is_owner() or not c.is_private)
   order by b.start_date desc
$$;

-- ============================================================================
-- صلاحية تنفيذ الدوال: المسجّلون فقط، والمساعدة الداخلية لا تُستدعى من الخارج
-- ============================================================================

revoke execute on all functions in schema public from public, anon;
revoke execute on function public.audit(uuid, text, text, uuid, jsonb, jsonb) from authenticated;
revoke execute on function public.funding_category(uuid) from authenticated;
revoke execute on function public.assign_role_on_signup() from authenticated;
revoke execute on function public.create_profile_on_signup() from authenticated;
grant execute on function
  public.my_owner_id(), public.is_owner(),
  public.deposit_to_fund(uuid, numeric, text), public.create_fund(text, numeric),
  public.record_transaction(numeric, text, uuid, uuid, text, timestamptz),
  public.update_transaction(uuid, numeric, uuid, uuid, text, timestamptz),
  public.delete_transaction(uuid), public.approve_order(uuid),
  public.purchase_order(uuid, uuid, numeric, text),
  public.transaction_summary(timestamptz, timestamptz, uuid),
  public.budgets_with_spent()
to authenticated;
