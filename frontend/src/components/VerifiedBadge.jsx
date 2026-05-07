import { ShieldCheck } from "lucide-react";

/**
 * Verified healthcare professional badge.
 * Shown next to author names when user.is_verified_partner === true
 * or user.role === "verified_partner".
 *
 * Props:
 *   occupation  — optional string like "midwife", "doctor", "obstetrician" etc.
 *                 When provided, shown as "Verified Midwife" etc.
 *   className   — optional extra classes
 */

const OCCUPATION_LABELS = {
  midwife:              "Midwife",
  doctor:               "GP",
  obstetrician:         "Obstetrician",
  nurse:                "Nurse",
  psychologist:         "Psychologist",
  lactation_consultant: "Lactation Consultant",
  pediatrician:         "Paediatrician",
  social_worker:        "Social Worker",
  physiotherapist:      "Physiotherapist",
  other:                "Professional",
};

export default function VerifiedBadge({ occupation = "", className = "" }) {
  const label = occupation ? `Verified ${OCCUPATION_LABELS[occupation] ?? occupation}` : "Verified";

  return (
    <span
      title="Verified healthcare professional"
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-semibold leading-none shrink-0 ${className}`}
    >
      <ShieldCheck className="h-3 w-3" />
      {label}
    </span>
  );
}
