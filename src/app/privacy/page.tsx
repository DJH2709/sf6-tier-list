import type { Metadata } from "next";
import DeleteAccount from "@/components/DeleteAccount";
import LegalPage from "@/components/LegalPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy · ${SITE_NAME}`,
  description: `What ${SITE_NAME} stores about you, who can see it, and how to delete your account.`,
};

const REPO = "https://github.com/DJH2709/sf6-tier-list";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy notice" updated="31 October 2026">
      <p>
        {SITE_NAME} is a fan-made hobby site where players vote on fighting game tier lists, split by rank.
        This page says what it stores about you, who else sees it, and how to delete it. It is written in
        plain English on purpose. If anything is unclear, ask: contact details are at the bottom.
      </p>

      <h2>Who runs the site</h2>
      <p>
        {SITE_NAME} is run by an individual in the United Kingdom (GitHub:{" "}
        <a href="https://github.com/DJH2709">DJH2709</a>), not a company. It makes no money and shows no adverts.
        For UK data protection law, that person is the controller of the data described here.
      </p>

      <h2>What we store, and when</h2>
      <p><strong>If you vote without signing in</strong></p>
      <ul>
        <li>
          Supabase (our database and sign-in provider) creates an <em>anonymous user</em> for you: a random
          account ID with no name or email. It is kept in your browser so your vote stays yours and you can
          edit it later.
        </li>
        <li>Your tier list: the game, the patch, the rank you chose, and where you placed each character.</li>
      </ul>
      <p><strong>If you sign in</strong> (with Discord, Google, or another provider shown on the sign-in button)</p>
      <ul>
        <li>
          Supabase receives from that provider: your account ID with them, your display name, your avatar
          picture address, and your email address if the provider shares it. Your email is never shown on the
          site and we do not send email.
        </li>
        <li>Your profile: the username you pick, your display name, and your avatar address (Discord avatars only).</li>
        <li>Your tier lists, as above, plus whether each one is shown on your profile.</li>
        <li>
          A link to your in-game profile (for example Buckler&apos;s Boot Camp), if you give one to prove a top rank.
          It is checked by hand by the site owner.
        </li>
        <li>Who you follow, who follows you, and which lists you liked.</li>
        <li>A &quot;Pro&quot; or &quot;Influencer&quot; tag, if the site owner adds one to your profile.</li>
      </ul>
      <p>
        <strong>Community results</strong> are averages over many lists per rank band. They are not about any one
        person and stay on the site after a list or account is deleted.
      </p>

      <h2>What is public</h2>
      <p>
        Your profile page (<code>/u/your-username</code>) shows your username, display name, avatar, tag, your
        public tier lists with the rank you voted as, your followers and following, and likes on your lists.
        Lists you untick &quot;Show on my profile&quot; for are hidden from it but still count in the results.
        Anonymous votes are never shown individually.
      </p>

      <h2>Why we use it</h2>
      <p>
        Only to run the site: to save your list, show your profile and results, and keep one list per player per
        patch so one person cannot decide a tier list. We do not sell your data, use it for advertising, or build
        profiles of you for anything else.
      </p>

      <h2>Cookies and local storage</h2>
      <ul>
        <li>
          One cookie, <code>locale</code>, is set only if you pick a language in the switcher, so the site stays
          in that language. It lasts a year and tracks nothing.
        </li>
        <li>Your browser&apos;s local storage holds your sign-in session, and your votes when the site runs in demo mode.</li>
        <li>No analytics, advertising or tracking cookies, so there is no cookie banner.</li>
      </ul>

      <h2>Who else handles your data</h2>
      <ul>
        <li>
          <a href="https://supabase.com/privacy">Supabase</a> hosts the database and handles sign-in. The project is
          in their EU region (Ireland).
        </li>
        <li>
          <a href="https://vercel.com/legal/privacy-policy">Vercel</a> hosts the website. Like any web host it keeps
          standard request logs, including IP addresses, for a short time.
        </li>
        <li>
          The sign-in provider you choose, for example <a href="https://discord.com/privacy">Discord</a> or{" "}
          <a href="https://policies.google.com/privacy">Google</a>, under their own privacy policies. Discord
          avatars are loaded from Discord&apos;s servers.
        </li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        Until you delete your account. Anonymous votes are kept while the site runs, since they are not linked to
        a named person. If the site closes, the database is deleted with it.
      </p>

      <h2>Delete your account</h2>
      <p>
        Press the button below while signed in. It removes your sign-in record, profile, tier lists, likes and
        follows straight away. Community averages are not affected. This cannot be undone.
      </p>
      <DeleteAccount />

      <h2>Your rights</h2>
      <p>
        Under UK data protection law you can ask for a copy of your data, ask for it to be corrected, or ask for it
        to be deleted (or use the button above). To do so, or for anything else about this notice, open an issue
        at <a href={`${REPO}/issues`}>{REPO.replace("https://", "")}/issues</a>. If you are unhappy with how your
        data is handled you can complain to the UK Information Commissioner&apos;s Office at{" "}
        <a href="https://ico.org.uk/make-a-complaint/">ico.org.uk</a>.
      </p>

      <h2>Age</h2>
      <p>
        You need to be old enough to hold an account with your sign-in provider (13 or over for Discord and
        Google). The site does not knowingly collect data from younger children.
      </p>

      <h2>Changes</h2>
      <p>If this notice changes, the date at the top changes with it.</p>
    </LegalPage>
  );
}
