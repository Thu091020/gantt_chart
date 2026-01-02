-- Add text_style column to tasks table for storing row text styling (bold, italic)
ALTER TABLE public.tasks 
ADD COLUMN text_style TEXT DEFAULT NULL;