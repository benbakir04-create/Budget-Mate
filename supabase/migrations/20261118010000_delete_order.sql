-- وازن: رفض الطلبية أو إلغاؤها (BR-33)، كما يفعل التطبيق الحالي في شاشة الصناديق.
-- المالك يرفض أو يحذف أي طلبية في شبكته، والشريك يلغي طلبيته هو فقط.
-- الطلبية المشتراة تبقى، لأن مصروفها مسجّل ومربوط بها.

create function public.delete_order(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := public.my_owner_id();
  v_order public.orders;
begin
  if v_owner is null then perform public.fail('AUTHENTICATION_REQUIRED'); end if;
  select * into v_order from public.orders where id = p_id and owner_id = v_owner for update;
  if v_order.id is null then perform public.fail('NOT_FOUND'); end if;
  if v_order.status = 'purchased' then perform public.fail('ORDER_ALREADY_PURCHASED'); end if;
  if not public.is_owner() and v_order.requested_by <> auth.uid() then
    perform public.fail('FORBIDDEN_NOT_YOUR_ORDER');
  end if;

  delete from public.orders where id = p_id;
  perform public.audit(v_owner, 'delete', 'order', p_id, to_jsonb(v_order), null);
end $$;

revoke execute on function public.delete_order(uuid) from public, anon;
grant execute on function public.delete_order(uuid) to authenticated;
