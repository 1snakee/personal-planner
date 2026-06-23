import { useStore } from './store';

export async function processNoteWithAI(noteId: string, rawText: string) {
  const state = useStore.getState();
  const apiKey = state.openai_api_key;
  if (!apiKey) return; // Silent abort if no key is set

  // Get last 14 days of notes
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recentNotes = state.daily_notes
    .filter(n => n.id !== noteId && n.date >= cutoff)
    .slice(0, 30); // limit to recent 30 notes

  const contextStr = recentNotes.map(n => 
    `Note ID: ${n.id}\nDate: ${new Date(n.date).toISOString().split('T')[0]}\nContent/Summary: ${n.ai_summary || n.raw_text.substring(0, 200)}`
  ).join('\n\n');

const systemPrompt = `You are an analytical assistant organizing a user's 'Second Brain' journal.
Analyze the provided new note. Return a JSON object matching this exact structure:
{
  "ai_summary": "Eine extrem cleane, objektive Zusammenfassung des Textes. Formatiere Ideen oder To-Dos als kurze Bulletpoints, falls vorhanden.",
  "mood_score": <number 1-10 based on emotional tone, or null if neutral>,
  "tags": ["Tagebuch", "Idee"], // Optional array of strings. ONLY use exactly "Tagebuch" and/or "Idee". If it contains journal reflections, add "Tagebuch". If it contains an actionable thought or concept, add "Idee". Both can apply.
  "connections": [
    { "target_note_id": "<ID of related note from context>", "connection_reason": "<Short explanation, e.g. 'Beide behandeln die Business Idee'>", "strength": <number 1-5> }
  ]
}

Only create connections if there is a strong, meaningful topical overlap with the provided recent notes context.
If no meaningful connections exist, return an empty array for connections.
Respond ONLY with valid JSON.`;

  const userMessage = `Recent Notes Context:\n${contextStr || 'No recent notes.'}\n\nNew Note to Analyze:\n${rawText}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3
      })
    });

    if (!res.ok) {
      console.warn('OpenAI API Error:', await res.text());
      return;
    }
    
    const data = await res.json();
    const result = JSON.parse(data.choices[0].message.content);

    // Update Note with Summary, Mood, and Tags
    state.updateNote(noteId, {
      ai_summary: result.ai_summary,
      mood_score: result.mood_score,
      tags: result.tags || []
    });

    // Add Connections
    if (result.connections && Array.isArray(result.connections)) {
      const validConnections = result.connections
        .filter((c: any) => state.daily_notes.some(n => n.id === c.target_note_id)) // ensure target exists
        .map((c: any) => ({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
          source_note_id: noteId,
          target_note_id: c.target_note_id,
          connection_reason: c.connection_reason,
          strength: c.strength
        }));
        
      if (validConnections.length > 0) {
        state.addNoteConnections(validConnections);
      }
    }
  } catch (error) {
    console.error("AI Processing failed:", error);
  }
}
