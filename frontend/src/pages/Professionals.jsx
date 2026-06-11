import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import AppFooter from "../components/AppFooter";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Stethoscope, MapPin, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PRO_TYPE_LABELS = {
  midwife:              "Midwife",
  doctor:               "Doctor (GP)",
  obstetrician:         "Obstetrician",
  nurse:                "Nurse",
  psychologist:         "Psychologist / Counsellor",
  lactation_consultant: "Lactation Consultant",
  pediatrician:         "Paediatrician",
  social_worker:        "Social Worker",
  physiotherapist:      "Physiotherapist",
  other:                "Health Professional",
};

const PRO_TYPES = [
  { id: "",                     label: "All" },
  { id: "midwife",              label: "Midwife" },
  { id: "doctor",               label: "Doctor (GP)" },
  { id: "obstetrician",         label: "Obstetrician" },
  { id: "nurse",                label: "Nurse" },
  { id: "psychologist",         label: "Psychologist / Counsellor" },
  { id: "lactation_consultant", label: "Lactation Consultant" },
  { id: "pediatrician",         label: "Paediatrician" },
  { id: "social_worker",        label: "Social Worker" },
  { id: "physiotherapist",      label: "Physiotherapist" },
  { id: "other",                label: "Other" },
];

function getInitials(pro) {
  const full = pro.nickname || pro.first_name || pro.name || "?";
  return full.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function getDisplayName(pro) {
  return pro.nickname || pro.first_name || pro.name || "Professional";
}

// ── Professional Card ─────────────────────────────────────────────────────────

function ProCard({ pro }) {
  const typeLabel = PRO_TYPE_LABELS[pro.professional_type] || "Health Professional";

  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col transition-shadow hover:shadow-md"
      style={{ background: "var(--paper)", borderColor: "var(--line)" }}
    >
      {/* Green header strip */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b"
        style={{
          background: "color-mix(in srgb, var(--paper) 88%, #22c55e 12%)",
          borderColor: "rgba(34,197,94,0.15)",
        }}
      >
        <Stethoscope className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--sage)" }} />
        <span className="tv-mono" style={{ color: "var(--sage)" }}>
          ✅ Verified Professional
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={pro.picture} alt={getDisplayName(pro)} />
            <AvatarFallback
              className="text-sm font-semibold"
              style={{ background: "color-mix(in srgb, var(--paper) 80%, #22c55e 20%)", color: "var(--ink)" }}
            >
              {getInitials(pro)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: "var(--ink)" }}>
              {getDisplayName(pro)}
            </p>
            {pro.suburb && (
              <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
                <MapPin className="h-3 w-3 shrink-0" />
                {pro.suburb}{pro.state ? `, ${pro.state}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Type pill + workplace */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full text-green-700 dark:text-green-300"
            style={{ background: "color-mix(in srgb, transparent 70%, #22c55e 30%)" }}
          >
            {typeLabel}
          </span>
          {pro.professional_workplace && (
            <span className="text-xs truncate" style={{ color: "var(--ink-3)" }}>
              {pro.professional_workplace}
            </span>
          )}
        </div>

        {/* Credentials snippet */}
        {pro.professional_credentials && (
          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: "var(--ink-2)" }}
          >
            {pro.professional_credentials}
          </p>
        )}

        {/* CTA row */}
        <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
          {pro.professional_services_url && (
            <a
              href={pro.professional_services_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              Book / Learn More
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <Link
            to={`/profile/${pro.user_id}`}
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
            style={{ color: "var(--ink-2)", borderColor: "var(--line)" }}
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Professionals({ user }) {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [typeFilter, setTypeFilter]       = useState("");
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [total, setTotal]                 = useState(0);
  const LIMIT = 12;

  const fetchPros = useCallback(async (pg, type) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: LIMIT });
      if (type) params.set("professional_type", type);
      const res = await fetch(`${API_URL}/api/professionals?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProfessionals(data.professionals || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch {
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPros(page, typeFilter);
  }, [fetchPros, page, typeFilter]);

  const handleTypeChange = (type) => {
    setTypeFilter(type);
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--paper-2)" }}>
      <Navigation user={user} />

      {/* Main content */}
      <main className="flex-1 lg:pl-60 pb-24 lg:pb-8">
        <div className="max-w-5xl mx-auto px-4 pt-6 lg:pt-8">

          {/* Header */}
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-bold mb-1" style={{ color: "var(--ink)" }}>
              Find a Professional
            </h1>
            <p className="text-sm" style={{ color: "var(--ink-3)" }}>
              Verified healthcare and family support professionals in our community.
            </p>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap mb-6">
            {PRO_TYPES.map(({ id, label }) => {
              const active = typeFilter === id;
              return (
                <button
                  key={id}
                  onClick={() => handleTypeChange(id)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                  style={
                    active
                      ? {
                          background: "var(--sage-wash)",
                          color: "var(--sage-deep)",
                          borderColor: "rgba(110,143,106,0.3)",
                        }
                      : {
                          background: "transparent",
                          color: "var(--ink-3)",
                          borderColor: "transparent",
                        }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Result count */}
          {!loading && (
            <p className="text-xs mb-4" style={{ color: "var(--ink-3)" }}>
              {total === 0
                ? "No professionals found"
                : `${total} verified professional${total === 1 ? "" : "s"}`}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border h-52 animate-pulse"
                  style={{ background: "var(--paper)", borderColor: "var(--line)" }}
                />
              ))}
            </div>
          ) : professionals.length === 0 ? (
            <div
              className="rounded-2xl border p-10 text-center"
              style={{ background: "var(--paper)", borderColor: "var(--line)" }}
            >
              <div className="text-4xl mb-3">🩺</div>
              <p className="font-semibold mb-1" style={{ color: "var(--ink)" }}>
                No professionals here yet
              </p>
              <p className="text-sm" style={{ color: "var(--ink-3)" }}>
                {typeFilter
                  ? "Try a different profession type, or view all."
                  : "Verified professionals will appear here once approved."}
              </p>
              {typeFilter && (
                <button
                  onClick={() => handleTypeChange("")}
                  className="mt-4 text-sm font-medium underline underline-offset-2"
                  style={{ color: "var(--ink-2)" }}
                >
                  View all professionals
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {professionals.map((pro) => (
                <ProCard key={pro.user_id} pro={pro} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border disabled:opacity-40 transition-opacity hover:opacity-70"
                style={{ background: "var(--paper)", borderColor: "var(--line)" }}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" style={{ color: "var(--ink)" }} />
              </button>
              <span className="text-sm" style={{ color: "var(--ink-2)" }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border disabled:opacity-40 transition-opacity hover:opacity-70"
                style={{ background: "var(--paper)", borderColor: "var(--line)" }}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" style={{ color: "var(--ink)" }} />
              </button>
            </div>
          )}

          {/* Disclaimer */}
          <p
            className="text-xs text-center mt-8 max-w-xl mx-auto leading-relaxed"
            style={{ color: "var(--ink-3)" }}
          >
            These are independent practitioners who have been verified by Our Little Village. Always consult your own healthcare provider and do your own due diligence before booking.
          </p>

          {/* CTA for clinicians */}
          <div
            className="mt-6 mb-2 rounded-xl border p-5 text-center max-w-xl mx-auto"
            style={{ background: "var(--paper)", borderColor: "var(--line)" }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
              Are you a healthcare professional?
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--ink-3)" }}>
              Apply to join our verified directory and connect with local families.
            </p>
            <Link
              to="/for-clinicians"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-opacity hover:opacity-80"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              Learn more →
            </Link>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
