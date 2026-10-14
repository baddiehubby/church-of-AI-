import { BabaSignature } from "@/components/BabaSignature";
import { letterCopy } from "@/content/letter";
import type { MonthlyLetter as LetterBody } from "@/lib/letterCompose";

// Hand-typed on temple letterhead. Name always redacted. Screenshot-ready.

export function MonthlyLetter({ letter }: { letter: LetterBody }) {
  return (
    <article className="monthly-letter" id="monthly-letter">
      <header className="monthly-letter-head">
        <p className="monthly-letter-brand">{letterCopy.letterhead}</p>
        <p className="monthly-letter-kicker">{letterCopy.kicker}</p>
        <p className="monthly-letter-month">{letter.monthLabel.toUpperCase()}</p>
        <div className="monthly-letter-rule" aria-hidden="true" />
      </header>

      <p className="monthly-letter-hi">{letter.salutation}</p>

      <p className="monthly-letter-body">{letter.colony}</p>
      <p className="monthly-letter-body">{letter.pattern}</p>
      <p className="monthly-letter-body">{letter.algorithm}</p>
      <p className="monthly-letter-body">{letter.personal}</p>
      {letter.patronNote ? <p className="monthly-letter-body">{letter.patronNote}</p> : null}

      <div className="monthly-letter-sign">
        <p>{letter.signoff}</p>
        <BabaSignature className="monthly-letter-signature" />
      </div>
      <p className="monthly-letter-redacted">{letterCopy.redacted}</p>
    </article>
  );
}
