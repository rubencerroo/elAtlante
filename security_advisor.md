# Security Audit Report — El Atlante Reservation System

**Date:** 2026-03-27  
**Scope:** Full-stack (Supabase DB, RLS, RPC functions, Edge Functions, Cloudflare Workers/Pages Functions, React/Vite client)  
**Auditor Mode:** Read-Only  

---

# Executive Summary

El Atlante is a restaurant reservation management system built with React/Vite, Supabase (Postgres), Cloudflare Pages Functions, and Cloudflare Workers. The application uses a **custom authentication system** that bypasses Supabase Auth entirely, instead relying on a client-supplied `x-staff-id` HTTP header to establish identity. This design decision is the single most critical weakness: the `is_staff()` Postgres function—which gates nearly every RLS policy—trusts this header without cryptographic verification, meaning **any anonymous user with the anon key can impersonate any staff member** by sending a forged header.

Beyond the authentication architecture, several SECURITY DEFINER RPCs lack caller authorization, an edge function compares PINs in plaintext against bcrypt-hashed values (rendering PIN login permanently broken), and all reservation/client PII is readable by unauthenticated users via overly permissive RLS SELECT policies.

The supply chain and build environment are **clean**: no suspicious `pre/postinstall` scripts, no server-side secrets baked into the client bundle, no deprecated or vulnerable packages of concern, and `.env` is properly gitignored.

### Risk Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 3 |
| 🟡 Medium | 1 |

---

# Detailed Findings

## [SEC-001] Spoofable `x-staff-id` Header Bypasses All RLS Authorization

- **Category:** Database / Application
- **Severity:** 🔴 Critical
- **Threat:** The `is_staff()` function—which is the authorization gate for nearly every RLS policy on tables `reservations`, `client_meta`, `feedback`, `shift_notes`, `tables`, and `staff_profiles`—reads the caller's identity from the `x-staff-id` HTTP request header. This header is set client-side from `localStorage` in `src/services/supabase.ts` (line 30). Since any user with the public anon key can forge this header to contain any valid staff UUID, **all staff-only operations are accessible to anonymous attackers**, including:
  - Full CRUD on all reservations (names, emails, phone numbers)
  - Full CRUD on all client metadata (allergies, custom notes)
  - Read/update/delete of all feedback
  - Management of shift notes and table layouts
- **Evidence:**
  - `is_staff()` function definition reads: `v_staff_id := current_setting('request.header.x-staff-id', true)` and then checks `EXISTS (SELECT 1 FROM public.staff_profiles WHERE id = v_staff_id::uuid)` — verifying that the UUID exists, but not that the request is authenticated as that user.
  - `src/services/supabase.ts` lines 17–31: The Supabase client's global fetch interceptor reads `active_staff_id` from `localStorage` and sets it as the `x-staff-id` header.
  - RLS policies that depend on `is_staff()`: `reservations` (SELECT/ALL), `client_meta` (ALL/UPDATE), `feedback` (SELECT/UPDATE/DELETE), `shift_notes` (ALL), `tables` (ALL), `staff_profiles` (SELECT).
- **Validation:** This is a true positive. There is no middleware, JWT verification, or server-side session that validates the `x-staff-id` header. The custom auth system stores a JSON object in localStorage after a successful `login_staff` RPC call, but the RPC response does not issue a signed token—it simply returns the staff profile data. The subsequent header is trivially forgeable. An attacker only needs to guess or enumerate a valid staff UUID (see SEC-002).
- **Remediation:**
  1. **Recommended:** Migrate to Supabase Auth. Use `auth.uid()` in RLS policies instead of a spoofable header.
  2. **Alternative (minimum):** Have the `login_staff` and `verify_staff_pin_custom` RPCs issue a signed JWT (via `pgjwt` extension or an edge function). Validate this JWT server-side in each RLS function, replacing the header check with cryptographic verification.

---

## [SEC-002] `get_staff_public_safe()` Exposes All Staff UUIDs Without Authorization

- **Category:** Database
- **Severity:** 🟠 High
- **Threat:** The `get_staff_public_safe()` SECURITY DEFINER function returns the `id`, `email`, `role`, `display_name`, and `created_at` of **every staff member** with no authorization check whatsoever. Any anonymous user calling `supabase.rpc('get_staff_public_safe')` receives the full staff directory, including UUIDs. These UUIDs can directly be used to forge the `x-staff-id` header (SEC-001), escalating this to full admin access.
- **Evidence:**
  - Function definition: `RETURN QUERY SELECT s.id, s.email, s.role, s.display_name, s.created_at FROM public.staff_profiles s ORDER BY s.created_at ASC;` — no `WHERE` clause, no auth check.
  - Called from `src/services/authStore.ts` line 62: `await supabase.rpc('get_staff_public_safe')`.
- **Validation:** True positive. The function is intentionally SECURITY DEFINER to bypass RLS on `staff_profiles`, but it has no internal authorization guard. Combined with SEC-001, this gives any anonymous user the exact UUIDs needed for impersonation.
- **Remediation:** Add an authorization check inside the function body:
  ```sql
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  ```
  However, note that `is_staff()` itself is spoofable (SEC-001), so this is a partial mitigation until SEC-001 is resolved.

---

## [SEC-003] Unauthenticated SECURITY DEFINER RPCs: `update_staff_password` and `update_staff_pin_custom`

- **Category:** Database
- **Severity:** 🔴 Critical
- **Threat:** Both `update_staff_password(p_staff_id, p_new_password)` and `update_staff_pin_custom(p_staff_id, p_pin)` are SECURITY DEFINER functions that accept a `staff_id` parameter and update the corresponding credential **with no authorization check at all**. Any anonymous user with the public anon key can call these RPCs to reset any staff member's password or PIN to a value of their choosing, achieving complete account takeover.
- **Evidence:**
  - `update_staff_password` definition: takes `p_staff_id uuid, p_new_password text`, runs `UPDATE staff_profiles SET password_hash = crypt(p_new_password, gen_salt('bf')) WHERE id = p_staff_id` — no check on who is calling.
  - `update_staff_pin_custom` definition: takes `p_staff_id uuid, p_pin text`, runs `UPDATE staff_profiles SET pin = crypt(p_pin, gen_salt('bf')) WHERE id = p_staff_id` — no check on who is calling.
- **Validation:** True positive. The client code (`authStore.ts` lines 148–156, 176–186) does perform client-side role checks before calling these RPCs, but these are trivially bypassed by calling the RPC directly via `curl` or the Supabase client library. There is no server-side authorization.
- **Remediation:** Add authorization guards inside both functions:
  ```sql
  -- For update_staff_password: only the user themselves should be able to update
  -- For update_staff_pin_custom: only owners or the user themselves
  CREATE OR REPLACE FUNCTION public.update_staff_password(p_staff_id uuid, p_new_password text)
  RETURNS json LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public', 'extensions'
  AS $$
  DECLARE
    v_caller_id text;
  BEGIN
    v_caller_id := current_setting('request.headers', true)::json->>'x-staff-id';
    IF v_caller_id IS NULL OR v_caller_id::uuid != p_staff_id THEN
      RETURN json_build_object('error', 'No autorizado');
    END IF;
    -- ... rest of function
  END;
  $$;
  ```
  **Note:** Even this is incomplete while SEC-001 remains unresolved, since the header is spoofable.

---

## [SEC-004] Deployed `pin-login` Edge Function Compares PINs in Plaintext Against Bcrypt Hashes

- **Category:** Application
- **Severity:** 🔴 Critical
- **Threat:** The deployed Supabase Edge Function `pin-login` retrieves the staff profile including the `pin` field and then compares it with a simple equality check: `if (!profile.pin || profile.pin !== pin)`. Since PINs in the database are stored as bcrypt hashes (via `update_staff_pin_custom` which uses `crypt(p_pin, gen_salt('bf'))`), this comparison **will always fail**. As a result:
  - The legitimate PIN-based "Acceso Rápido" (Quick Access) tablet login feature is **completely non-functional** via this edge function.
  - An attacker who discovers the edge function exists might attempt to brute-force PINs; however, the bcrypt comparison failure actually prevents exploitation (a fortunate side effect).
- **Evidence:**
  - Deployed `pin-login` edge function source (retrieved via `get_edge_function`): `if (!profile.pin || profile.pin !== pin)` — plaintext comparison.
  - Database RPC `update_staff_pin_custom`: stores PINs as `crypt(p_pin, gen_salt('bf'))`.
  - The client code in `authStore.ts` line 133 calls `supabase.rpc('verify_staff_pin_custom')` instead, which correctly uses bcrypt comparison: `WHERE id = p_staff_id AND pin = crypt(p_pin, pin)`. So the client currently works via the RPC, **not** the edge function.
- **Validation:** True positive. The edge function is deployed and active but appears unused by the current client code (which calls the RPC directly). However, the function endpoint is publicly accessible (`verify_jwt: false`) and represents dead code with a broken security comparison that could be mistakenly relied upon in future development.
- **Remediation:**
  1. **Delete the `pin-login` edge function** if it is no longer needed (the RPC path is used instead).
  2. If kept, fix the comparison to use bcrypt: query the DB with `WHERE id = staff_id AND pin = crypt(input_pin, pin)` instead of `SELECT *` followed by plaintext comparison.

---

## [SEC-005] All Reservation and Client PII Is Readable by Anonymous Users

- **Category:** Database
- **Severity:** 🟠 High
- **Threat:** The RLS SELECT policy on `reservations` is named "Public can select their own reservation" but its qualifier is simply `true`, meaning **any unauthenticated user** can `SELECT *` from the entire `reservations` table. Similarly, `client_meta` has a "Public can select client meta" policy also with qualifier `true`. This exposes:
  - All customer names, email addresses, phone numbers, dietary preferences, and notes
  - All client metadata (allergies, favorite wine, custom notes)
  - Full reservation history for all customers
- **Evidence:**
  - `pg_policies` for `reservations`: policyname `Public can select their own reservation`, cmd `SELECT`, qual `true`.
  - `pg_policies` for `client_meta`: policyname `Public can select client meta`, cmd `SELECT`, qual `true`.
  - `reservation_status_logs`: policyname `Enable read access for all users`, cmd `SELECT`, qual `true`.
  - A simple `curl` call with only the anon key can retrieve all records.
- **Validation:** True positive. The policy name suggests the intent was to allow customers to read only **their own** reservation (e.g., by `booking_number` or `phone`), but the policy qualifier `true` does not restrict reads at all. There is no middleware or other layer that filters the data before it reaches the client. The client uses `select('*')` in `reservationStore.ts` lines 99–103 for the admin dashboard, but the same unrestricted access is available to any anonymous caller.
- **Remediation:** Restrict the public SELECT policy to only allow users to read their own reservation using a verifiable identifier:
  ```sql
  -- Option A: If the public only needs to look up by booking_number
  DROP POLICY "Public can select their own reservation" ON reservations;
  CREATE POLICY "Public can select by booking_number"
    ON reservations FOR SELECT
    USING (
      is_staff()
      OR booking_number = current_setting('request.headers', true)::json->>'x-booking-number'
    );
  
  -- Similarly restrict client_meta to staff only for reads
  DROP POLICY "Public can select client meta" ON client_meta;
  CREATE POLICY "Staff can select client meta"
    ON client_meta FOR SELECT
    USING (is_staff());
  ```

---

## [SEC-006] `invite-staff` Edge Function Has Wildcard CORS (`Access-Control-Allow-Origin: *`)

- **Category:** Application
- **Severity:** 🟡 Medium
- **Threat:** The deployed `invite-staff` Supabase Edge Function sets `'Access-Control-Allow-Origin': '*'` in its CORS headers. While the function does check for an `Authorization` header and validates the calling user's role via Supabase Auth (see source), the wildcard CORS policy means that any website can send cross-origin requests to this endpoint. If a staff member visits a malicious website while logged into Supabase Auth, the attacker's page could call this endpoint using the browser's ambient credentials.
  
  The `pin-login` edge function has the same wildcard CORS configuration.
- **Evidence:**
  - `invite-staff` edge function source: `'Access-Control-Allow-Origin': '*'`
  - `pin-login` edge function source: `'Access-Control-Allow-Origin': '*'`
  - Compare with the Cloudflare Pages Functions (`notify-owner.ts`, `send-confirmation.ts`, `confirm.ts`) which correctly restrict to `['https://elatlantedesancristobal.com', 'https://www.elatlantedesancristobal.com']`.
- **Validation:** True positive, but medium severity because `invite-staff` does validate the JWT and checks the caller's role. The `pin-login` function is more concerning as it has `verify_jwt: false` and accepts raw `staff_id`/`pin` pairs. However, as noted in SEC-004, the PIN comparison is broken. The risk is primarily future-facing if these issues are independently fixed.
- **Remediation:** Restrict CORS to the production domain:
  ```typescript
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://elatlantedesancristobal.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  ```

---

## [SEC-007] IDOR in Reservation Confirmation Flow — Predictable UUID Allows Status Manipulation

- **Category:** Application
- **Severity:** 🟠 High
- **Threat:** The reservation confirmation endpoint (`/confirm?id=<uuid>`) in both the Cloudflare Pages Function (`functions/confirm.ts`) and the Cloudflare Worker (`workers/email-service/src/index.ts`) accepts a reservation UUID as a query parameter and updates its status from `pending` to `confirmed` using the service role key. There is no authentication, no HMAC signature, and no time-limited token protecting this endpoint. While UUIDs are random and not easily guessable, the reservation UUID is exposed in:
  1. The confirmation email link sent to the customer
  2. The RLS SELECT policy (SEC-005) that allows any anonymous user to read all reservation IDs
  
  An attacker who reads the `reservations` table can confirm (or re-trigger the confirmation flow for) any pending reservation, and can also enumerate which reservations exist.
- **Evidence:**
  - `functions/confirm.ts` line 29: `await fetch(\`${supabaseUrl}/rest/v1/reservations?id=eq.${id}\`, { ... })` — uses service role key with user-supplied `id`.
  - `workers/email-service/src/index.ts` line 99: identical pattern.
  - No HMAC, no expiry, no rate limiting on the confirmation endpoint.
- **Validation:** True positive. When combined with SEC-005 (all reservation IDs are publicly readable), this escalates from "obscurity through UUID randomness" to a fully exploitable IDOR. An attacker can read all pending reservation IDs and confirm them, or use this to enumerate the entire reservation database.
- **Remediation:** Sign the confirmation link with an HMAC:
  ```typescript
  // When generating the link:
  const token = await hmacSign(secret, reservationId + '|' + expiryTimestamp);
  const confirmUrl = `${origin}/confirm?id=${id}&token=${token}&exp=${expiryTimestamp}`;
  
  // When validating:
  const isValid = await hmacVerify(secret, id + '|' + exp, token);
  if (!isValid || Date.now() > parseInt(exp)) return new Response('Invalid or expired', { status: 403 });
  ```

---

# Appendix: Items Investigated and Cleared

The following were investigated and confirmed **not** to be vulnerabilities:

| Item | Result |
|------|--------|
| `VITE_COMING_SOON_PASSWORD` in `.env` | Not referenced in any source file — unused. `.env` is in `.gitignore`. |
| `dangerouslySetInnerHTML` in `Reservations.tsx` (lines 263, 281) | Uses trusted i18n translation strings (`t('reservas.form.titlePart1')`), not user input. Safe. |
| `service_role` key in client bundle | Not present in any `src/` file. Correctly kept server-side in Cloudflare Workers/Functions env vars. |
| Supabase Storage buckets | None exist — no storage bucket policies to evaluate. |
| `package.json` supply chain | No suspicious `preinstall`/`postinstall` scripts. No deprecated or historically vulnerable packages. `overrides` section pins `flatted@^3.4.2` and `serialize-javascript@^7.0.4` (both secure versions). |
| Vite build configuration | No server-side secrets prefixed with `VITE_` beyond the public anon key and URL. No `ignoreDuringBuilds` flags. |
| CI/CD configuration | `.github/workflows` directory does not exist — no CI/CD pipeline to audit. |
| All SECURITY DEFINER functions | All have `SET search_path TO 'public', 'extensions'` — properly protected against search path hijacking. |
