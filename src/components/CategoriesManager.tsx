"use client";

import { useState } from "react";
import { createCategory, deleteCategory, renameCategory } from "@/app/actions/categories";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { inputClass, buttonPrimaryClass, cardClass } from "@/components/ui/formStyles";
import { canWriteAny, canWriteRow } from "@/lib/sharing";
import type { Category } from "@/lib/subscriptions";
import type { Role } from "@/lib/sharing";

export function CategoriesManager({
  categories,
  viewerId,
  role,
  overviewOwnerId,
}: {
  categories: Category[];
  viewerId: string;
  role: Role;
  overviewOwnerId: string;
}) {
  const canAdd = canWriteAny(role);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("name", newName);
    formData.set("overview_owner_id", overviewOwnerId);
    const result = await createCategory(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setNewName("");
    }
  }

  async function handleRename(id: string) {
    const result = await renameCategory(id, editValue);
    if (result.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      setError(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Diese Kategorie wirklich löschen?")) return;
    const result = await deleteCategory(id);
    if (result.error) setError(result.error);
  }

  return (
    <div className="space-y-6">
      {canAdd && (
        <form onSubmit={handleCreate} className={`${cardClass} flex flex-wrap items-end gap-3`}>
          <div className="min-w-[200px] flex-1">
            <FieldLabel required htmlFor="new-category">
              Neue Kategorie
            </FieldLabel>
            <input
              id="new-category"
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={inputClass}
            />
          </div>
          <button type="submit" className={buttonPrimaryClass}>
            Hinzufügen
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className={cardClass}>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-600">Noch keine Kategorien angelegt.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {categories.map((category) => {
              const canEdit = canWriteRow(role, viewerId, category.created_by);
              return (
                <li key={category.id} className="flex items-center gap-3 py-3">
                  {editingId === category.id ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className={`${inputClass} flex-1`}
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(category.id)}
                        className="text-sm font-semibold text-orange-600 hover:underline"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-sm text-gray-600 hover:underline"
                      >
                        Abbrechen
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-gray-900">{category.name}</span>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(category.id);
                              setEditValue(category.name);
                            }}
                            className="text-sm text-gray-700 hover:underline"
                          >
                            Umbenennen
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="text-sm text-red-700 hover:underline"
                          >
                            Löschen
                          </button>
                        </>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
