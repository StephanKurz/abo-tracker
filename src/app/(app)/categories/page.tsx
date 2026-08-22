import { redirect } from "next/navigation";

// Kategorien werden jetzt unter "Einstellungen" verwaltet; diese Route bleibt
// als Weiterleitung erhalten, damit alte Links/Lesezeichen weiter funktionieren.
export default function CategoriesPage() {
  redirect("/account");
}
