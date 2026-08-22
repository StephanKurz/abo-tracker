// Erstellt eine Todoist-Aufgabe aus Nutzer-Feedback. Projekt/Abschnitt sind in
// Todoist per Name vorgegeben (nicht als feste ID hinterlegt, da Feedback
// selten genug eintrifft, dass der zusätzliche Namens-Lookup nicht ins
// Gewicht fällt und robuster gegenüber künftigen Umbenennungen ist).

const API = "https://api.todoist.com/rest/v2";
const PROJECT_NAME = "Softwareprojekte";
const SECTION_NAME = "Apps Kurz-Intelligence";
const LABEL = "Abo-Radar";

async function todoistFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Todoist-API-Fehler (${path}): ${res.status}`);
  return res.json();
}

export async function createFeedbackTask(text: string, userEmail: string): Promise<void> {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) throw new Error("TODOIST_API_TOKEN ist nicht gesetzt.");

  const projects = await todoistFetch<{ id: string; name: string }[]>("/projects", token);
  const project = projects.find((p) => p.name === PROJECT_NAME);
  if (!project) throw new Error(`Todoist-Projekt "${PROJECT_NAME}" nicht gefunden.`);

  const sections = await todoistFetch<{ id: string; name: string }[]>(
    `/sections?project_id=${project.id}`,
    token,
  );
  const section = sections.find((s) => s.name === SECTION_NAME);
  if (!section) throw new Error(`Todoist-Abschnitt "${SECTION_NAME}" nicht gefunden.`);

  const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
  const today = new Date().toISOString().slice(0, 10);

  await todoistFetch("/tasks", token, {
    method: "POST",
    body: JSON.stringify({
      content: `Abo-Radar Feedback: ${preview}`,
      description: `${text}\n\n${userEmail}`,
      project_id: project.id,
      section_id: section.id,
      labels: [LABEL],
      due_date: today,
    }),
  });
}
