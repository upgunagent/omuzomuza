import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAuthClient } from '@/lib/supabaseClient'; // Client for auth check

export async function POST(req: NextRequest) {
    try {
        // 1. Check if the requester is authenticated and is an admin
        // Note: In a real app, middleware handles session, but here we double check.
        // We use the anon client to get the session of the requester.
        // However, extracting the token from the request header is cleaner.

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Init Service Role Client
        // We need service role NOT ONLY for deletion but also to READ the profile
        // securely without relying on RLS policies that might block the anon client.
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!serviceRoleKey || !supabaseUrl) {
            console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Check if user is admin using Service Role Client
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Only admins can delete users' }, { status: 403 });
        }



        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 3. Reassign Jobs to Admin (Requester) to resolve Foreign Key Constraint
        // Since user says consultants shouldn't create jobs, we "take over" any that might exist to be safe.
        const { error: updateJobsError } = await supabaseAdmin
            .from('jobs')
            .update({ created_by: user.id })
            .eq('created_by', userId);

        if (updateJobsError) {
            console.error("Error reassigning jobs:", updateJobsError);
            return NextResponse.json({ error: "Failed to reassign jobs: " + updateJobsError.message }, { status: 500 });
        }

        // 4. Delete from Profiles FIRST
        const { error: profileDeleteError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileDeleteError) {
            console.error("Error deleting user profile:", profileDeleteError);
            return NextResponse.json({ error: "Failed to delete profile: " + profileDeleteError.message }, { status: 500 });
        }

        // 4. Delete from Auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error("Error deleting user from auth:", deleteError);
            // If auth delete fails, we might have an issue where profile is gone but user remains.
            // This is a trade-off. We could try to restore profile, but let's assume if profile delete worked, auth delete likely works unless another constraint exists.
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'User deleted successfully' });

    } catch (error: any) {
        console.error("Delete user API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
