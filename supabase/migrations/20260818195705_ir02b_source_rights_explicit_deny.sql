-- IR-02B explicit client-role deny policies
-- Production migration version: 20260818195705

drop policy if exists source_rights_registry_deny_anon on private.source_rights_registry;
create policy source_rights_registry_deny_anon
on private.source_rights_registry
for all
to anon
using (false)
with check (false);

drop policy if exists source_rights_registry_deny_authenticated on private.source_rights_registry;
create policy source_rights_registry_deny_authenticated
on private.source_rights_registry
for all
to authenticated
using (false)
with check (false);
