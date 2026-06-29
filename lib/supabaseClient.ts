import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UniqueUser = {
  user_id: string;
  username: string;
};

export async function getUniqueCommenters(videoUrl: string): Promise<UniqueUser[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("user_id, username")
    .eq("video_url", videoUrl);

  if (error) throw error;

  const seen = new Map<string, UniqueUser>();
  for (const row of data ?? []) {
    seen.set(row.user_id, row);
  }
  return Array.from(seen.values());
}
