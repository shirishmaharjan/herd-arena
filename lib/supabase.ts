import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase credentials
const supabaseUrl = 'https://vmfkngwbqrjxgiokaixy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtZmtuZ3dicXJqeGdpb2thaXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDg1NDMsImV4cCI6MjA5NTI4NDU0M30.2I9VI0e9vKjEmbbh1zQGEFIobL5fybnGLCc6mwXth0Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)