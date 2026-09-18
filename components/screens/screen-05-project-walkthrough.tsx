"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  MapPin,
  Signpost,
  Building2,
  Sparkles,
  LayoutGrid,
  PuzzleIcon,
  ShieldCheck,
  Compass,
  Download,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenShell } from "@/components/screen-shell";
import { BrochureModal } from "@/components/brochure-modal";
import { VerifiedInfo, ConfirmWithHoabl } from "@/components/trust/trust-sections";
import { useJourney } from "@/lib/journey-context";
import { useAira } from "@/lib/aira-context";
import { useVoiceCommands } from "@/lib/voice-command-context";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { PROJECT } from "@/lib/data";
import { Project } from "@/lib/types";

// Real project footage, saved locally at public/aero.mp4 — only Aero Estate
// has a video; every other project falls back to its hero photo.
const AERO_VIDEO_URL = "/aero.mp4";

type Accent = "forest" | "gold";

interface Section {
  id: string;
  label: string;
  caption: string;
  icon: React.ElementType;
  accent: Accent;
  verified: { label: string; value: string }[];
  confirm: string[];
}

const ACCENT_CLASSES: Record<Accent, { chip: string; icon: string; ring: string; glow: string }> = {
  forest: {
    chip: "bg-forest-800/10 text-forest-800",
    icon: "bg-gradient-to-br from-forest-700 to-forest-900 text-ivory-50",
    ring: "border-forest-800/15",
    glow: "shadow-[0_8px_24px_-8px_rgba(35,85,52,0.45)]",
  },
  gold: {
    chip: "bg-gold-500/15 text-gold-600",
    icon: "bg-gradient-to-br from-gold-400 to-gold-600 text-forest-950",
    ring: "border-gold-500/25",
    glow: "shadow-[0_8px_24px_-8px_rgba(172,131,54,0.45)]",
  },
};

// Aero Estate is the only project with real, sourced facts beyond starting
// price — its specific figures (NMIA distance, developer entity, etc.) only
// show up when it's the one selected; other projects fall back to what's
// actually known for them (just the illustrative starting price) rather
// than borrowing Aero Estate's facts.
function buildSections(project: Project): Section[] {
  const isFeatured = project.id === PROJECT.id;
  return [
    {
      id: "location",
      label: "Location",
      icon: MapPin,
      accent: "forest",
      caption: "Your priority was accessibility, so let's start with how the project connects to the surrounding area.",
      verified: [
        { label: "Location", value: project.location },
        ...(isFeatured
          ? [
              { label: "Distance to NMIA", value: "~40 minutes" },
              { label: "Position", value: "Equidistant between Mumbai and Pune" },
            ]
          : []),
      ],
      confirm: ["Exact road route and drive time in traffic", "Local infrastructure build-out timeline"],
    },
    {
      id: "connectivity",
      label: "Connectivity",
      icon: Signpost,
      accent: "gold",
      caption: "Here's how the project links to the wider region today.",
      verified: isFeatured
        ? [
            { label: "Airport", value: "Navi Mumbai International Airport — operational" },
            { label: "Regional standing", value: "#1 of 8 national micro-markets, per Colliers (as cited by HoABL)" },
          ]
        : [],
      confirm: isFeatured ? ["Upcoming highway/expressway specifics"] : ["Regional connectivity specifics"],
    },
    {
      id: "development",
      label: "Development",
      icon: Building2,
      accent: "forest",
      caption: "This is the broader vision the developer has shared for the region.",
      verified: [
        ...(isFeatured ? [{ label: "Committed regional capital", value: "₹3,00,000 crore (as cited by HoABL)" }] : []),
        { label: "Developer", value: "House of Abhinandan Lodha Estate Holdings Pvt Ltd" },
      ],
      confirm: ["Master-plan phase-wise handover dates", "Future commercial zoning"],
    },
    {
      id: "amenities",
      label: "Amenities",
      icon: Sparkles,
      accent: "gold",
      caption: "Since amenities mattered to you, here's what's confirmed so far.",
      verified: project.verified,
      confirm: ["Full on-site amenity list", "Maintenance charges post-handover"],
    },
    {
      id: "layout",
      label: "Land layout",
      icon: LayoutGrid,
      accent: "forest",
      caption: "Here's an illustrative pocket layout, to show how plots typically get organized — not this project's actual released plan.",
      verified: [
        { label: "Pockets shown", value: "8 illustrative pockets (demo layout)" },
        { label: "Plot sizes shown", value: "1,500 – 2,100 sq.ft. (demo layout)" },
      ],
      confirm: ["This project's actual plot-by-plot layout and pricing (unlocks after token + KYC)"],
    },
    {
      id: "pocket-logic",
      label: "Pocket logic",
      icon: PuzzleIcon,
      accent: "gold",
      caption: "Each pocket balances access, privacy, view and price differently — there's no single 'best' pocket, only the best fit for you.",
      verified: [{ label: "Pocket criteria", value: "Road access, privacy, amenity proximity, view, price" }],
      confirm: ["Final pocket-wise release schedule"],
    },
    {
      id: "consider",
      label: "Consider",
      icon: ShieldCheck,
      accent: "forest",
      caption: "A few things worth knowing before you go further.",
      verified: [
        { label: "Booking process", value: "Browse and shortlist freely — refundable token + KYC once you've chosen a pocket" },
      ],
      confirm: project.needsConfirmation,
    },
  ];
}

export function Screen05ProjectWalkthrough() {
  const { next, selectedProject } = useJourney();
  const { speak } = useAira();
  const [idx, setIdx] = useState(0);
  const [showBrochureModal, setShowBrochureModal] = useState(false);
  const sections = useMemo(() => buildSections(selectedProject), [selectedProject]);
  const section = sections[idx];
  const accent = ACCENT_CLASSES[section.accent];

  useEffect(() => {
    speak(section.caption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  const goToPocketMap = () => {
    track("project_walkthrough_completed");
    next();
  };

  const openBrochureModal = () => {
    track("brochure_cta_clicked", { project: selectedProject.id });
    setShowBrochureModal(true);
  };

  const shareBrochure = async () => {
    track("brochure_share_clicked", { project: selectedProject.id });
    const brochureUrl = selectedProject.brochureUrl || "/aero.pdf";
    const absoluteUrl = `${window.location.origin}${brochureUrl}`;
    const shareText = `${selectedProject.name} — brochure`;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, text: shareText, url: absoluteUrl });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${absoluteUrl}`)}`, "_blank");
  };

  const goToSection = (i: number) => {
    if (i === sections.length - 1) {
      goToPocketMap();
      return;
    }
    setIdx(i);
  };

  useVoiceCommands([
    { labels: ["next", "continue"], action: () => goToSection(Math.min(idx + 1, sections.length - 1)) },
    { labels: ["pocket map", "find your pocket", "show me the pocket map"], action: goToPocketMap },
    ...sections.map((s, i) => ({ labels: [s.label], action: () => goToSection(i) })),
  ]);

  return (
    <ScreenShell showStages={false} title="Project walkthrough">
      <div className="flex h-full flex-col pb-5">
        {selectedProject.heroImage && (
          <motion.div
            key={selectedProject.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative h-40 w-full shrink-0 overflow-hidden"
          >
            {selectedProject.id === PROJECT.id ? (
              <video
                src={AERO_VIDEO_URL}
                poster={selectedProject.heroImage}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedProject.heroImage} alt={selectedProject.name} className="h-full w-full object-cover" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/45 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-forest-950/50 to-transparent" />
            <div className="absolute inset-x-4 bottom-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-300">
                Exploring with Aira
              </p>
              <h1 className="mt-0.5 font-serif text-2xl leading-tight text-ivory-50">{selectedProject.name}</h1>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ivory-100/80">
                <MapPin className="h-3 w-3 shrink-0" /> {selectedProject.location}
              </p>
            </div>
          </motion.div>
        )}

        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto px-5 pb-1">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goToSection(i)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                i === idx
                  ? "border-forest-800 bg-forest-800 text-ivory-100"
                  : i < idx
                  ? "border-forest-800/30 bg-forest-800/8 text-forest-800"
                  : "border-forest-900/10 bg-white text-forest-900/50"
              )}
            >
              {i < idx ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex-1 overflow-y-auto no-scrollbar px-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <div className={cn("flex items-start gap-3 rounded-xl2 border bg-white p-3.5", accent.ring, accent.glow)}>
                <motion.span
                  initial={{ scale: 0.6, rotate: -8 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16 }}
                  className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", accent.icon)}
                >
                  <section.icon className="h-[18px] w-[18px]" />
                </motion.span>
                <div className="min-w-0">
                  <p className={cn("mb-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", accent.chip)}>
                    {section.label}
                  </p>
                  <p className="text-sm text-forest-900/75">{section.caption}</p>
                </div>
              </div>

              {section.id === "location" && (
                <div className="relative overflow-hidden rounded-xl2 border border-forest-900/8 shadow-card">
                  <div className="flex items-center justify-between bg-forest-900 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ivory-100">
                      <Compass className="h-3.5 w-3.5 text-gold-400" /> Live map
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-medium text-ivory-100/70">
                      Google Maps
                    </span>
                  </div>
                  <iframe
                    title={`${selectedProject.name} location map`}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(selectedProject.location)}&output=embed`}
                    className="h-44 w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <p className="bg-white px-3 py-2 text-[11px] text-forest-900/40">
                    Centered on the stated location — verify exact plot boundaries with your HoABL advisor.
                  </p>
                </div>
              )}

              {section.id === "layout" && <ProjectMapPreview />}

              <VerifiedInfo items={section.verified} />
              <ConfirmWithHoabl items={section.confirm} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-2 px-5 pt-3">
          <div className="flex gap-2">
            <Button variant="outline" size="md" className="flex-1" onClick={openBrochureModal}>
              <Download className="h-4 w-4" /> Brochure
            </Button>
            <Button variant="outline" size="md" className="flex-1" onClick={shareBrochure}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
          <Button size="lg" className="w-full" onClick={goToPocketMap}>
            View pocket map &rarr;
          </Button>
        </div>
      </div>

      <BrochureModal
        open={showBrochureModal}
        onClose={() => setShowBrochureModal(false)}
        projectName={selectedProject.name}
        brochureUrl={selectedProject.brochureUrl || "/aero.pdf"}
      />
    </ScreenShell>
  );
}

const LAYOUT_ZONES = [
  { cls: "left-[6%] top-[12%] w-[36%] h-[32%]", tone: "bg-gold-500/70" },
  { cls: "left-[46%] top-[8%] w-[30%] h-[40%]", tone: "bg-forest-500/70" },
  { cls: "left-[8%] top-[50%] w-[30%] h-[36%]", tone: "bg-forest-600/70" },
  { cls: "left-[42%] top-[54%] w-[36%] h-[32%]", tone: "bg-gold-600/60" },
];

function ProjectMapPreview() {
  return (
    <div className="relative h-32 overflow-hidden rounded-xl2 border border-forest-900/8 bg-gradient-to-br from-forest-800 to-forest-950 shadow-card">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 13px, rgba(255,255,255,0.4) 14px), repeating-linear-gradient(90deg, transparent, transparent 13px, rgba(255,255,255,0.4) 14px)",
        }}
      />
      {LAYOUT_ZONES.map((z, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + i * 0.06 }}
          className={cn("absolute rounded-lg ring-1 ring-white/20", z.cls, z.tone)}
        />
      ))}
      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] font-medium text-ivory-100 backdrop-blur">
        <LayoutGrid className="h-2.5 w-2.5" /> Illustrative layout — demo
      </div>
    </div>
  );
}
