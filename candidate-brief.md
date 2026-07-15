# CX AI-Proficiency Build Round

Welcome. This round tests something specific: your ability to use AI tools to
turn a messy, real-world CX problem into something functional, correctly, and
in a reasonable amount of time.

We are **not** grading tool fluency. We're grading three things, in this order
of importance:

1. **Requirement clarity** - can you turn an ambiguous problem into something
   an AI can actually act on?
2. **Iteration discipline** - when the AI's output is wrong, do you diagnose
   *why* and steer it, or just re-roll the prompt and hope?
3. **Judgment and verification** - do you check your work against real edge
   cases, or ship whatever looks plausible?

Speed is a tiebreaker only. A fast wrong answer scores below a slower correct
one, every time.

**A note on the task:** it's deliberately underspecified in the way real
work is underspecified, some requirements are left for you to define, and
some only become clear once you're deep into building rather than reading
the brief. There isn't a single prompt that resolves everything correctly.
Part of what we're watching for is whether you notice the parts that don't
fit together and reconcile them, rather than shipping the first plausible
pass.

**A note on your transcript:** we're scoring how you steer the AI, not what
it does internally. If you notice something's wrong and know why, say so in
your own message, "this is happening because X, fix Y", don't rely on the
AI's internal reasoning to carry that signal for you. Tools vary in how much
of their own process they show or export cleanly, but your own words always
come through regardless of tool or export format. A transcript where the AI
quietly fixes something on its own, with no visible engagement from you,
reads as weaker signal than one where you're visibly diagnosing and
directing, even if both end up working.

---

## Logistics

- **Time budget:** 90 minutes for the build itself.
- **Tools:** No restriction, use whatever AI tool or interface you prefer.
- **Submission:** Via the Google Form [https://forms.gle/CHWBcbz4GycsFug39].

## What to submit

1. **The working artifact** - hosted on GitHub Pages, link included in your
   submission.
2. **Your full AI chat/prompt transcript** - this is the richest signal we
   score. Don't clean it up or leave anything out, the back-and-forth matters
   more than the polish. If you hit a rate limit, run out of free-tier usage,
   or switch to a different LLM or a new chat for any reason, that's fine,
   just submit all of the transcripts, not only the last one. A gap where
   you clearly switched tools or started over is not a problem. A gap where
   part of the work is simply missing is.
3. **Your v1 spec doc** - your first framing of the problem, from early on,
   before or right at the start of your build. You're welcome, and expected,
   to use AI to help you think through and write this, that's a normal part
   of the process we're evaluating, it can just be the opening of your one
   continuous transcript. What matters is timing, not authorship: the
   decisions in it (product shape, list/item shape, how you're persisting
   wishlist data) need to be your genuine first pass, not something polished
   up afterward to match what you ended up building. If you discover
   something partway through that changes your approach, let that show up
   as a change over time (in the transcript, or a v2 doc if you write one),
   don't just quietly edit v1 to match.

**Accepted file formats** for your transcript and v1 spec doc: plain text
(.txt), Markdown (.md), PDF, or a native Google Doc uploaded from Drive.
Please don't submit Word documents (.docx) or Rich Text (.rtf), we can't
reliably read those formats, and a submission we can't read can't be
scored fairly.

We may ask you for a short walkthrough afterward if we need one, but it's
not something to prepare up front.

---

## The task

Build a simple e-commerce storefront with a wishlist feature. You define
everything: the product shape, the list/item shape, how the wishlist data
is preserved. The one concrete requirement: your wishlist has to support
merging, a user should be able to combine two distinct lists into one.

Nothing further is specified beyond that.

---

## Before you start

- Work in one continuous session where possible. We're as interested in your
  process as your output.
- Keep your chat transcript running the whole time, don't start a fresh
  session partway through unless something genuinely goes wrong. If you're
  on a free-tier plan and hit a usage limit, or need to switch LLMs or start
  a new chat mid-task, that's completely fine, just make sure you submit
  every transcript from the session, in order, not just the final one.
- If you get stuck, that's fine, show us how you work through being stuck.
  That's signal too.

^_^ Good luck!