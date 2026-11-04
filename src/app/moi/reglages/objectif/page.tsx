"use client";

import { useState } from "react";
import { FilterGroup } from "@/components/ui/filter";
import { BackLink, PageTitle, SectionHead } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { Sheet } from "@/components/ui/sheet";
import { showToast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { ValueSheet } from "@/components/ui/value-sheet";
import type { Profile } from "@/config/profile";
import { RULES } from "@/config/rules";
import { useBody } from "@/features/body/use-targets";
import { DateSheet } from "@/features/goal/date-sheet";
import {
  adjustCapOf,
  arrivalDate,
  defaultProtein,
  earliestDate,
  isTooFast,
  maxPctPerWeek,
  minGoalKg,
  monthPart,
  proteinWarning,
  requiredPctPerWeek,
} from "@/features/goal/goal";
import { profileBounds } from "@/features/profile/draft";
import { saveProfile, useProfile } from "@/features/profile/profile";
import { WhySheet, type WhySection } from "@/features/profile/why-sheet";
import { useT } from "@/i18n/use-t";
import { addDays, toISODate } from "@/lib/dates";

type Edit = "goalKg" | "protein" | "fat" | "adjust" | "date" | "why";
type T = ReturnType<typeof useT>["t"];
type N = ReturnType<typeof useT>["n"];

const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Moi › Réglages › Objectif (Figma 12:1334, 12:1402, 91:2686). Chaque changement est enregistré tout de suite. */
export default function GoalPage() {
  const { t, n, locale } = useT();
  const profile = useProfile();
  const today = toISODate(new Date());
  const body = useBody(today);
  const [edit, setEdit] = useState<Edit | null>(null);
  if (!profile) return null;

  const avgKg = body?.avgKg ?? null;
  const goalKg = profile.goalKg;
  const close = () => setEdit(null);
  const save = (patch: Partial<Profile>) => saveProfile(patch).catch(() => showToast(t("profile.save-error")));

  const thisYear = today.slice(0, 4);
  const monthName = (iso: string) =>
    new Intl.DateTimeFormat(locale, iso.slice(0, 4) === thisYear ? { month: "long" } : { month: "long", year: "numeric" }).format(parse(iso));
  const around = (iso: string) => t("goal.eta", { when: t(`goal.part.${monthPart(iso)}`, { month: monthName(iso) }) });
  const shortDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, iso.slice(0, 4) === thisYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" }).format(parse(iso));

  const eta = avgKg !== null && goalKg !== undefined ? arrivalDate(today, avgKg, goalKg, RULES.lossPctPerWeek.value) : null;
  const pace = avgKg !== null && goalKg !== undefined && profile.goalDate ? requiredPctPerWeek(avgKg, goalKg, today, profile.goalDate) : null;
  const earliest =
    avgKg !== null && goalKg !== undefined && profile.goalDate && isTooFast(today, avgKg, goalKg, profile.strength, profile.goalDate)
      ? earliestDate(today, avgKg, goalKg, profile.strength)
      : null;

  let whenNote: string | null = null;
  if (goalKg !== undefined) {
    if (avgKg === null) whenNote = t("goal.no-weight");
    else if (goalKg >= avgKg) whenNote = t("goal.reached");
    else if (profile.goalDate) whenNote = pace !== null && Number.isFinite(pace) ? t("goal.pace", { pct: n(pace * 100, 1) }) : null;
    else if (eta) whenNote = around(eta);
  }

  const warning = proteinWarning(profile.proteinGPerKg);
  const back = defaultProtein(profile.strength);
  const goalBounds = profileBounds("goalKg");
  const minGoal = Math.max(goalBounds.min, minGoalKg(profile.heightCm));
  const proteinBounds = profileBounds("proteinGPerKg");
  const fatBounds = profileBounds("fatPct");
  const cap = adjustCapOf(profile);

  return (
    <div>
      <BackLink href="/moi/reglages/">{t("goal.back")}</BackLink>
      <PageTitle className="mt-3.5">{t("goal.title")}</PageTitle>

      <section className="mt-8">
        <SectionHead why={t("goal.why")} onWhy={() => setEdit("why")}>
          {t("goal.section")}
        </SectionHead>
        <div className="mt-2 flex items-center justify-between gap-3 py-3">
          <span className="text-corps">{t("goal.strength")}</span>
          <Toggle label={t("goal.strength")} on={profile.strength} onChange={(strength) => save({ strength })} />
        </div>
        <Row
          label={t("goal.target")}
          value={goalKg !== undefined ? t("goal.kg", { n: n(goalKg, 1) }) : t("goal.none")}
          chevron
          onClick={() => setEdit("goalKg")}
        />
        <div className="flex items-start justify-between gap-3 pt-2.5">
          <span className="min-w-0 flex-1 text-corps">{t("goal.when")}</span>
          <div className="flex flex-col items-end gap-2">
            <FilterGroup<"none" | "date">
              label={t("goal.when")}
              value={profile.goalDate ? "date" : "none"}
              onChange={(v) => (v === "none" ? save({ goalDate: undefined }) : setEdit("date"))}
              options={[
                { value: "none", label: t("goal.when-none") },
                { value: "date", label: profile.goalDate ? shortDate(profile.goalDate) : t("goal.when-date") },
              ]}
            />
            {whenNote && <p className="num text-right text-valeur text-texte-discret">{whenNote}</p>}
          </div>
        </div>
        {earliest && (
          <InlineAlert
            text={t("goal.too-fast", { date: shortDate(earliest) })}
            action={t("goal.take-earliest")}
            onAction={() => save({ goalDate: earliest })}
          />
        )}
      </section>

      <section className="mt-[50px]">
        <SectionHead>{t("goal.calc")}</SectionHead>
        <div className="mt-2">
          <Row
            label={t("goal.protein")}
            value={t("goal.protein-value", { n: n(profile.proteinGPerKg, 1) })}
            chevron
            onClick={() => setEdit("protein")}
          />
          {warning && (
            <>
              <InlineAlert
                text={
                  warning === "high"
                    ? t("goal.protein-high", { max: n(RULES.proteinRange.value.max, 1) })
                    : t("goal.protein-low", { min: n(RULES.proteinRange.value.min, 1) })
                }
                action={t("goal.reset", { n: n(back, 1) })}
                onAction={() => save({ proteinGPerKg: back })}
              />
              <div className="h-1" aria-hidden />
            </>
          )}
          <Row label={t("goal.fat")} value={t("goal.fat-value", { n: n(profile.fatPct * 100) })} chevron onClick={() => setEdit("fat")} />
          <Row label={t("goal.adjust")} value={t("goal.adjust-value", { n: n(cap) })} chevron onClick={() => setEdit("adjust")} />
        </div>
      </section>

      {edit === "goalKg" && (
        <ValueSheet
          open
          onClose={close}
          title={t("goal.target")}
          unit={t("goal.unit-kg")}
          value={goalKg ?? Math.round((avgKg ?? minGoal) * 10) / 10}
          min={minGoal}
          max={goalBounds.max}
          saveLabel={t("goal.save")}
          onSave={(v) => save({ goalKg: Math.round(v * 10) / 10 })}
        />
      )}
      {edit === "protein" && (
        <ValueSheet
          open
          onClose={close}
          title={t("goal.protein")}
          unit={t("goal.unit-gkg")}
          value={profile.proteinGPerKg}
          {...proteinBounds}
          saveLabel={t("goal.save")}
          onSave={(v) => save({ proteinGPerKg: Math.round(v * 10) / 10 })}
        />
      )}
      {edit === "fat" && (
        <ValueSheet
          open
          onClose={close}
          title={t("goal.fat")}
          unit={t("goal.unit-pct")}
          value={Math.round(profile.fatPct * 100)}
          min={fatBounds.min * 100}
          max={fatBounds.max * 100}
          saveLabel={t("goal.save")}
          onSave={(v) => save({ fatPct: Math.round(v) / 100 })}
        />
      )}
      <Sheet open={edit === "adjust"} onClose={close} label={t("goal.adjust")}>
        <h2 className="text-section font-medium">{t("goal.adjust")}</h2>
        <div role="radiogroup" aria-label={t("goal.adjust")} className="mt-2">
          {RULES.adjustCaps.value.map((c) => (
            <Row
              key={c}
              dense
              checked={c === cap}
              label={t("goal.adjust-value", { n: n(c) })}
              onClick={() => {
                save({ adjustCapKcal: c });
                close();
              }}
            />
          ))}
        </div>
      </Sheet>
      <DateSheet
        open={edit === "date"}
        onClose={close}
        initial={profile.goalDate ?? eta ?? addDays(today, 7 * 8)}
        min={addDays(today, 1)}
        onPick={(goalDate) => save({ goalDate })}
      />
      <WhySheet
        open={edit === "why"}
        onClose={close}
        title={t("goal.why-panel.title")}
        hint={t("goal.hint")}
        sections={whySections(profile, avgKg, pace, t, n)}
      />
    </div>
  );
}

/** Composant « Alerte » discret du Figma 12:1402 : phrase grise et lien bleu pour revenir au conseil. */
function InlineAlert({ text, action, onAction }: { text: string; action: string; onAction: () => void }) {
  return (
    <div className="flex items-center gap-1 text-petit">
      <p className="min-w-0 flex-1 text-texte-discret">{text}</p>
      <button className="tap shrink-0 text-actif" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}

function whySections(p: Profile, avgKg: number | null, pace: number | null, t: T, n: N): WhySection[] {
  const pct = n(RULES.lossPctPerWeek.value * 100, 1);
  const k = p.strength ? "on" : "off";
  const diff = p.goalKg !== undefined && avgKg !== null ? Math.round((p.goalKg - avgKg) * 10) / 10 : null;
  return [
    {
      title: t("goal.why-panel.when"),
      item: p.goalDate
        ? {
            mine: true,
            label: t("goal.why-panel.date-label"),
            value: pace !== null && Number.isFinite(pace) ? t("goal.pace", { pct: n(pace * 100, 1) }) : undefined,
            text: t("goal.why-panel.date-text", { max: n(maxPctPerWeek(p.strength) * 100, 1) }),
          }
        : { mine: true, label: t("goal.why-panel.none-label"), value: t("goal.pace", { pct }), text: t(`goal.why-panel.none-text-${k}`) },
    },
    {
      title: t("goal.why-panel.strength"),
      item: {
        mine: true,
        label: t(`goal.why-panel.${k}`),
        value: t("goal.protein-value", { n: n(p.proteinGPerKg, 1) }),
        text: t(`goal.why-panel.${k}-text`, { pct }),
      },
    },
    {
      title: t("goal.why-panel.target"),
      item:
        p.goalKg !== undefined
          ? {
              mine: true,
              monoLabel: true,
              label: t("goal.kg", { n: n(p.goalKg, 1) }),
              value: diff === null ? undefined : t(diff < 0 ? "goal.diff-minus" : "goal.diff-plus", { n: n(Math.abs(diff), 1) }),
              text: t("goal.why-panel.target-text"),
            }
          : { label: t("goal.why-panel.target-none"), text: t("goal.why-panel.target-text") },
    },
    {
      title: t("goal.why-panel.body"),
      item: { label: t("goal.why-panel.body-label"), text: t("goal.why-panel.body-text") },
    },
  ];
}
