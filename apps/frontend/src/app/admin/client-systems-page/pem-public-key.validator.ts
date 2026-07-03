import { AbstractControl, ValidationErrors } from '@angular/forms';

const PEM_PUBLIC_KEY_PREFIX = '-----BEGIN PUBLIC KEY-----';

export function pemPublicKeyValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value = control.value as string | null;
  if (!value) {
    return null; // Validators.required se encarga de los vacíos.
  }
  return value.startsWith(PEM_PUBLIC_KEY_PREFIX) ? null : { pemFormat: true };
}
