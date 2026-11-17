-- Cutover migration: old clients may still load and export, but cannot write
-- through the legacy endpoint that bypasses cloud-save validation. Deploy the
-- new Edge Function before applying this migration and deploy the compatible
-- frontend immediately afterwards. Roll back access with explicit GRANTs only.
revoke execute on function public.family_save(bigint, jsonb) from public, anon, authenticated;
revoke execute on function family_private.save_family(bigint, jsonb) from public, anon, authenticated;
