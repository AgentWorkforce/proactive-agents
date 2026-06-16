export default function Unauthorized() {
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "https://agentrelay.com";
  return (
    <div className="mx-auto max-w-md space-y-4 pt-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Not authorized</h1>
      <p className="text-sm text-[var(--fg-muted)]">
        Admin access is limited to <code>@agentrelay.com</code> accounts.
      </p>
      <p className="text-sm text-[var(--fg-muted)]">
        <a href={webUrl} className="underline">
          Sign in at agentrelay.com
        </a>{" "}
        and return here.
      </p>
    </div>
  );
}
