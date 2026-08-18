alter table private.business_terms_versions
  drop constraint if exists business_terms_privacy_notice_version_fkey;

alter table private.business_terms_versions
  add constraint business_terms_privacy_notice_version_fkey
  foreign key (privacy_notice_version)
  references private.privacy_notice_versions(notice_version)
  deferrable initially immediate;

create or replace function private.enforce_active_privacy_for_business_terms()
returns trigger
language plpgsql
security definer
set search_path=private,pg_temp
as $$
declare
  v_status text;
begin
  if new.status='active' then
    select status into v_status
      from private.privacy_notice_versions
     where notice_version=new.privacy_notice_version;
    if coalesce(v_status,'') <> 'active' then
      raise exception 'active_privacy_notice_required:%', coalesce(new.privacy_notice_version,'missing') using errcode='23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_active_privacy_for_business_terms() from public, anon, authenticated;

drop trigger if exists trg_business_terms_require_active_privacy on private.business_terms_versions;
create trigger trg_business_terms_require_active_privacy
before insert or update of status,privacy_notice_version on private.business_terms_versions
for each row execute function private.enforce_active_privacy_for_business_terms();

comment on function private.enforce_active_privacy_for_business_terms() is 'IR-02D cross-gate: Business Terms cannot become active unless the referenced HOY Privacy Notice version is itself active.';
