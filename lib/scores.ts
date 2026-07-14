import { createClient } from "./supabase/client";

export interface ScoreRow {
  id: string;
  initials: string;
  score: number;
  wave: number;
  created_at: string;
}

export async function submitScore(
  initials: string,
  score: number,
  wave: number,
): Promise<ScoreRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invaders_scores")
    .insert({ initials: initials.toUpperCase().slice(0, 3), score, wave })
    .select()
    .single();
  if (error) {
    console.error("submitScore failed", error);
    return null;
  }
  return data as ScoreRow;
}

export async function getTopScores(limit = 10): Promise<ScoreRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invaders_scores")
    .select("*")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("getTopScores failed", error);
    return [];
  }
  return (data ?? []) as ScoreRow[];
}
