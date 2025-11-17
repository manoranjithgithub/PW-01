import { AbstractControl, ValidationErrors } from "@angular/forms";

/**
 * Toggle visibility for a password field tracked in a Set<string>.
 * The helper mutates the provided Set for convenience.
 */
export function togglePasswordField(visibleFields: Set<string>, field: string): void {
  if (visibleFields.has(field)) {
    visibleFields.delete(field);
  } else {
    visibleFields.add(field);
  }
}