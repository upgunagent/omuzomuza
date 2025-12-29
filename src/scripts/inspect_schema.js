
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oiakelqansdzkweahhpo.supabase.co';
// Using Service Role Key to bypass RLS
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pYWtlbHFhbnNkemt3ZWFoaHBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA0Mzk4MSwiZXhwIjoyMDc5NjE5OTgxfQ.UxeerIgN1yvVW1em5zAfGTFCDi6DRA48swUE5vT9Pak';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect(table) {
    console.log(`\n--- Inspecting ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
        console.error(`Error fetching ${table}:`, error.message);
    } else if (data && data.length > 0) {
        console.log("Keys:", Object.keys(data[0]).join(", "));
        console.log("Sample Data:", JSON.stringify(data[0], null, 2));
    } else {
        console.log(`Table ${table} is empty or exists but no data.`);
    }
}

async function main() {
    await inspect('happy_engelsiz');
    await inspect('omuzomuza_engelli');
}

main();
