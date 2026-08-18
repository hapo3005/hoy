revoke execute on function public.log_analytics_event(text,bigint,uuid,uuid,jsonb) from anon, authenticated;
comment on function public.log_analytics_event(text,bigint,uuid,uuid,jsonb) is 'IR-02D privacy gate: production analytics transport disabled for client roles until consent/cookie legal basis, Privacy Notice and consent UI are approved and deployed.';
