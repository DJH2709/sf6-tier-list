import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: `The ground rules for using ${SITE_NAME}.`,
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="31 October 2026">
      <p>
        These are the ground rules for using {SITE_NAME}. By using the site you agree to them. They are short
        because the site is simple: you vote on tier lists, and you can show your votes on a profile.
      </p>

      <h2>What the site is</h2>
      <p>
        {SITE_NAME} is a free, fan-made hobby project run by an individual in the United Kingdom. It is not
        affiliated with or endorsed by Capcom, Bandai Namco, Nintendo, or any other game publisher. Game and
        character names belong to their owners.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>You can vote without an account. Signing in (Discord, Google or another provider) adds a public profile.</li>
        <li>You must meet your sign-in provider&apos;s age rule, which is 13 or over for Discord and Google.</li>
        <li>One account per person. Keep your sign-in provider account safe; whatever is done from it counts as you.</li>
        <li>
          Usernames must not impersonate someone else, a game company or a pro player, and must not be offensive.
          We may rename or remove a profile that does.
        </li>
      </ul>

      <h2>Your votes and content</h2>
      <ul>
        <li>
          You own your tier lists. By submitting one you let us store it, count it in the community results, and
          show it on your profile if you leave it public.
        </li>
        <li>Ranks are self-reported. Top ranks need proof and are checked by hand; we may reject a claim or move a list to a lower band.</li>
        <li>&quot;Pro&quot; and &quot;Influencer&quot; tags are given by the site owner and can be removed at any time.</li>
      </ul>

      <h2>Fair play</h2>
      <p>
        The point of the site is one honest vote per player per patch. Do not create extra accounts to vote more
        than once, automate voting, scrape profiles to harass players, or try to break the site. We may remove
        votes, lists or accounts that do, without notice.
      </p>

      <h2>Availability and liability</h2>
      <ul>
        <li>The site is provided as it is, free of charge, by a hobbyist. It may change, break or close at any time.</li>
        <li>
          To the extent the law allows, we are not liable for any loss arising from using the site or from it being
          unavailable. Nothing here limits liability that cannot be limited under English law.
        </li>
      </ul>

      <h2>Privacy</h2>
      <p>
        What we store about you and how to delete it is in the <Link href="/privacy">privacy notice</Link>.
      </p>

      <h2>Changes and contact</h2>
      <p>
        If these terms change, the date at the top changes with it. Questions go to{" "}
        <a href="https://github.com/DJH2709/sf6-tier-list/issues">github.com/DJH2709/sf6-tier-list/issues</a>.
        These terms are governed by the law of England and Wales.
      </p>
    </LegalPage>
  );
}
