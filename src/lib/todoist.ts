// Erstellt Todoist-Aufgaben (Feedback aus der App, eingehende Kontakt-Mails).
// Projekt/Abschnitt sind in Todoist per Name vorgegeben (nicht als feste ID
// hinterlegt, da beide Quellen selten genug eintreffen, dass der zusätzliche
// Namens-Lookup nicht ins Gewicht fällt und robuster gegenüber künftigen
// Umbenennungen ist).

// Todoist hat die alte REST-API v2 (api.todoist.com/rest/v2) abgeschaltet
// (HTTP 410 Gone) und durch eine vereinheitlichte API v1 ersetzt. Deren
// Listen-Endpunkte (z.B. /projects, /sections) liefern nicht mehr direkt ein
// Array, sondern { results: [...], next_cursor: ... } (Cursor-Pagination).
const API = "https://api.todoist.com/api/v1";
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

/**
 * Holt ALLE Einträge eines paginierten v1-Endpunkts, folgt dazu next_cursor
 * über so viele Seiten wie nötig (z.B. Unterprojekte können auf einer
 * späteren Seite liegen als auf der ersten). Toleriert auch ein rohes Array,
 * falls sich das Antwortformat nochmal ändert.
 */
async function todoistList<T>(path: string, token: string): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | null = null;

  do {
    const separator = path.includes("?") ? "&" : "?";
    const url: string = cursor ? `${path}${separator}cursor=${encodeURIComponent(cursor)}` : path;
    type Page = T[] | { results: T[]; next_cursor: string | null };
    const data: Page = await todoistFetch<Page>(url, token);
    if (Array.isArray(data)) return [...results, ...data];
    results.push(...data.results);
    cursor = data.next_cursor;
  } while (cursor);

  return results;
}

/**
 * Legt eine Aufgabe im festen Ziel (Projekt "Softwareprojekte" -> Abschnitt
 * "Apps Kurz-Intelligence", Label "Abo-Radar", fällig heute) an.
 */
export async function createTodoistTask(content: string, description: string): Promise<void> {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) throw new Error("TODOIST_API_TOKEN ist nicht gesetzt.");

  const projects = await todoistList<{ id: string; name: string }>("/projects", token);
  const project = projects.find((p) => p.name === PROJECT_NAME);
  if (!project) throw new Error(`Todoist-Projekt "${PROJECT_NAME}" nicht gefunden.`);

  const sections = await todoistList<{ id: string; name: string }>(
    `/sections?project_id=${project.id}`,
    token,
  );
  const section = sections.find((s) => s.name === SECTION_NAME);
  if (!section) throw new Error(`Todoist-Abschnitt "${SECTION_NAME}" nicht gefunden.`);

  const today = new Date().toISOString().slice(0, 10);

  await todoistFetch("/tasks", token, {
    method: "POST",
    body: JSON.stringify({
      content,
      description,
      project_id: project.id,
      section_id: section.id,
      labels: [LABEL],
      due_date: today,
    }),
  });
}

export async function createFeedbackTask(text: string, userEmail: string): Promise<void> {
  const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
  await createTodoistTask(`Abo-Radar Feedback: ${preview}`, `${text}\n\n${userEmail}`);
}

export async function createContactEmailTask(input: {
  from: string;
  subject: string;
  text: string;
}): Promise<void> {
  const subject = input.subject || "(ohne Betreff)";
  const preview = subject.length > 80 ? `${subject.slice(0, 80)}…` : subject;
  const description = [`Von: ${input.from}`, `Betreff: ${subject}`, "", input.text].join("\n");
  await createTodoistTask(`Kontaktanfrage: ${preview}`, description);
}
