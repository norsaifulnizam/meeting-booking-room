export const passwordRequirements = [
  { label: "8 to 12 characters", matches: (password: string) => password.length >= 8 && password.length <= 12 },
  { label: "One uppercase letter", matches: (password: string) => /[A-Z]/.test(password) },
  { label: "One lowercase letter", matches: (password: string) => /[a-z]/.test(password) },
  { label: "One number", matches: (password: string) => /\d/.test(password) },
] as const;

export function isValidPassword(password: string) {
  return passwordRequirements.every((requirement) => requirement.matches(password));
}

type PasswordRequirementsProps = { password: string };

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const startedTyping = password.length > 0;

  return <ul className="password-requirements" aria-label="Password requirements">
    {passwordRequirements.map((requirement) => {
      const satisfied = requirement.matches(password);
      const state = !startedTyping ? "pending" : satisfied ? "met" : "unmet";
      return <li className={state} key={requirement.label}>
        <span aria-hidden="true">{state === "met" ? "✓" : state === "unmet" ? "✕" : "○"}</span>
        {requirement.label}
      </li>;
    })}
  </ul>;
}