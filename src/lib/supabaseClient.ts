import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://oiakelqansdzkweahhpo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pYWtlbHFhbnNkemt3ZWFoaHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNDM5ODEsImV4cCI6MjA3OTYxOTk4MX0.s40LrqjEjig0O6FvyjfDWKk1wM5cvtKesdG_Q4SnuHs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
