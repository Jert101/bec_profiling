export default function SupabaseSetup() {
  return (
    <div className="mx-auto max-w-[1100px] px-10 pb-16 pt-10">
      <div className="rounded-md border border-line bg-white px-8 py-12">
        <h1 className="mb-4 font-serif text-2xl text-teal-dark">
          Supabase not configured
        </h1>
        <p className="mb-4 text-sm leading-relaxed text-slate-light">
          Set up your Supabase project and add the connection keys to connect this app.
        </p>
        <ol className="mb-6 list-decimal space-y-2 pl-5 text-sm text-slate">
          <li>
            Create a project at{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-teal underline"
            >
              supabase.com
            </a>
          </li>
          <li>
            Run the SQL migration under{" "}
            <code className="rounded bg-sage-light px-1.5 py-0.5 font-mono text-xs text-teal-dark">
              supabase/migrations/0001_init.sql
            </code>{" "}
            in the Supabase SQL Editor
          </li>
          <li>
            Create a{" "}
            <code className="rounded bg-sage-light px-1.5 py-0.5 font-mono text-xs text-teal-dark">
              .env.local
            </code>{" "}
            file with your project URL and anon key
          </li>
          <li>
            Restart the dev server (<code className="rounded bg-sage-light px-1.5 py-0.5 font-mono text-xs text-teal-dark">npm run dev</code>)
          </li>
        </ol>
        <pre className="overflow-x-auto rounded-md bg-teal-dark p-4 font-mono text-xs text-cream">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
      </div>
    </div>
  );
}