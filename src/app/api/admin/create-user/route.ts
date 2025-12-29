import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAuthClient } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
    try {
        // 1. Authorization Check (Same as delete-user)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Service Role Client Init
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!serviceRoleKey || !supabaseUrl) {
            console.error("Missing env vars for service role");
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 3. Parse Body
        const body = await req.json();
        const { email, password, first_name, last_name, role } = body;

        if (!email || !password || !first_name || !last_name) {
            return NextResponse.json({ error: 'All fields (email, password, first_name, last_name) are required' }, { status: 400 });
        }

        // 4. Create User in Auth
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto confirm email
            user_metadata: {
                first_name: first_name,
                last_name: last_name
            }
        });

        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        if (!userData.user) {
            return NextResponse.json({ error: "User creation failed unexpectedly" }, { status: 500 });
        }

        const userId = userData.user.id;

        // 5. Create/Update Profile
        // We need to ensure the profile exists with the correct role and names.
        // Usually, a trigger might create the profile on auth.users insert.
        // If so, we should UPDATE. If not, we INSERT.
        // `upsert` is safest.

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                role: 'consultant', // Enforce consultant role for this specific UI flow
                first_name: first_name,
                last_name: last_name,
                created_at: new Date().toISOString()
            });

        if (profileError) {
            console.error("Profile creation error:", profileError);
            // Optional: Try to rollback auth user creation?
            // await supabaseAdmin.auth.admin.deleteUser(userId);
            return NextResponse.json({ error: "User created but profile update failed: " + profileError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Consultant created successfully', user: userData.user });

    } catch (error: any) {
        console.error("Create user API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
