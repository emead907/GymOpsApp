import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  // Only callable server-side — service role key never reaches the browser
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { email, password, full_name, role } = await req.json()

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // 1. Create the auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? "Failed to create user" }, { status: 400 })
  }

  // 2. Insert the profile row
  const { error: profileError } = await adminClient.from("profiles").insert({
    id: authData.user.id,
    full_name,
    role: role ?? "coach",
  })

  if (profileError) {
    // Roll back the auth user so we don't end up with orphans
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ user: { id: authData.user.id, email, full_name, role } })
}
