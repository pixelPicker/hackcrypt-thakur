import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_SUPABASE_PUBLIC_KEY!;
const supabaseKey = process.env.NEXT_SUPABASE_PRIVATE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
