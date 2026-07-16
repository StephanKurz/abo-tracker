export function FieldLabel({
  required,
  children,
  htmlFor,
}: {
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-semibold mb-1 ${
        required ? "text-required" : "text-optional"
      }`}
    >
      {children}
      {required && <span className="ml-0.5">*</span>}
    </label>
  );
}
