"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilterGroup } from "@/components/ui/filter";
import { BackLink, PageTitle, SectionHead } from "@/components/ui/page";
import { Row } from "@/components/ui/row";
import { showToast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { ValueSheet } from "@/components/ui/value-sheet";
import type { Profile, Sex } from "@/config/profile";
import { RULES } from "@/config/rules";
import { bmr, KCAL_FLOOR, shownLoss, startTargets, type Targets } from "@/engine/targets";
import { useBody } from "@/features/body/use-targets";
import { adjustCapOf } from "@/features/goal/goal";
import { decimals, profileBounds, withStrength } from "@/features/profile/draft";
import { saveProfile, useProfile } from "@/features/profile/profile";
import { useLastWeight } from "@/features/profile/use-last-weight";
import { WhySheet, type WhySection } from "@/features/profile/why-sheet";
import { useT } from "@/i18n/use-t";
import { toISODate } from "@/lib/dates";

type Field = "age" | "heightCm" | "fiberG" | "waterL";
type Why = "result" | "split";

/** Moi › Profil (Figma 12:1155) : les changements restent un brouillon jusqu'à « Enregistrer ». */
export default function ProfilePage() {
  const profile = useProfile();
  // Le formulaire démarre une fois le profil lu : son état local ne suit plus la base ensuite.
  return profile ? <ProfileForm initial={profile} /> : null;
}

function ProfileForm({ initial }: { initial: Profile }) {
  const { t, n } = useT();
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState<Field | null>(null);
  const [why, setWhy] = useState<Why | null>(null);
  const [saving, setSaving] = useState(false);
  const body = useBody(toISODate(new Date()));
  const lastKg = useLastWeight();
  const avgKg = body?.avgKg ?? null;
  const targets = avgKg === null ? null : startTargets(draft, avgKg);

  const set = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }));
  const fields: Record<Field, { title: string; unit: string; digits: number }> = {
    age: { title: t("profile.age"), unit: t("profile.age-unit"), digits: 0 },
    heightCm: { title: t("profile.height"), unit: t("profile.height-unit"), digits: 0 },
    fiberG: { title: t("profile.fiber"), unit: t("profile.unit-g"), digits: 0 },
    waterL: { title: t("profile.water"), unit: t("profile.unit-l"), digits: 1 },
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveProfile(draft);
      showToast(t("profile.saved"));
      router.push("/moi/");
    } catch {
      showToast(t("profile.save-error"));
      setSaving(false);
    }
  };

  return (
    <div>
      <BackLink href="/moi/">{t("profile.back")}</BackLink>
      <PageTitle className="mt-3.5">{t("profile.title")}</PageTitle>

      <section className="mt-8">
        <SectionHead>{t("profile.you")}</SectionHead>
        <div className="mt-2 flex items-center justify-between gap-3 py-2.5">
          <span className="text-corps">{t("profile.sex")}</span>
          <FilterGroup<Sex>
            label={t("profile.sex")}
            value={draft.sex}
            onChange={(sex) => set({ sex })}
            options={[
              { value: "m", label: t("profile.sex-m") },
              { value: "f", label: t("profile.sex-f") },
            ]}
          />
        </div>
        <Row label={t("profile.age")} value={t("profile.age-value", { n: n(draft.age) })} chevron onClick={() => setEditing("age")} />
        <Row label={t("profile.height")} value={t("profile.height-value", { n: n(draft.heightCm) })} chevron onClick={() => setEditing("heightCm")} />
        <Row
          label={t("profile.weight")}
          detail={t("profile.weight-detail")}
          value={lastKg ? t("profile.kg", { n: n(lastKg, 1) }) : t("profile.none")}
        />
      </section>

      <section className="mt-[26px]">
        <SectionHead>{t("profile.activity")}</SectionHead>
        <div role="radiogroup" aria-label={t("profile.activity")} className="mt-2">
          {RULES.activityLevels.value.map((level, i) => (
            <Row
              key={level}
              checked={draft.activity === level}
              label={t(`profile.levels.${i}.label`)}
              detail={t(`profile.levels.${i}.detail`)}
              value={t("profile.factor", { n: n(level, decimals(level)) })}
              onClick={() => set({ activity: level })}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-corps">{t("profile.strength")}</span>
            <span className="text-petit text-texte-discret">{t("profile.strength-detail", { n: n(draft.proteinGPerKg, 1) })}</span>
          </span>
          <Toggle label={t("profile.strength")} on={draft.strength} onChange={(on) => setDraft((d) => withStrength(d, on))} />
        </div>
      </section>

      <section className="mt-[26px]">
        <SectionHead why={t("profile.why")} onWhy={() => setWhy("result")}>
          {t("profile.result")}
        </SectionHead>
        {targets && avgKg !== null ? (
          <Result draft={draft} avgKg={avgKg} targets={targets} />
        ) : (
          <p className="mt-2 text-corps text-texte-discret">{t("profile.no-weight")}</p>
        )}
      </section>

      <section className="mt-[26px]">
        <SectionHead why={t("profile.why")} onWhy={() => setWhy("split")}>
          {t("profile.split")}
        </SectionHead>
        <div className="mt-2">
          <Row label={t("profile.protein")} value={targets ? t("profile.g", { n: n(targets.protein) }) : t("profile.none")} />
          <Row label={t("profile.fat")} value={targets ? t("profile.g", { n: n(targets.fat) }) : t("profile.none")} />
          <Row label={t("profile.carbs")} value={targets ? t("profile.g", { n: n(targets.carbs) }) : t("profile.none")} />
          <Row label={t("profile.fiber")} value={t("profile.g", { n: n(draft.fiberG) })} chevron onClick={() => setEditing("fiberG")} />
          <Row label={t("profile.water")} value={t("profile.l", { n: n(draft.waterL, 1) })} chevron onClick={() => setEditing("waterL")} />
        </div>
      </section>

      <Button className="mt-7" onClick={save} disabled={saving}>
        {t("profile.save")}
      </Button>
      <div className="h-10" aria-hidden />

      {editing && (
        <ValueSheet
          open
          onClose={() => setEditing(null)}
          title={fields[editing].title}
          unit={fields[editing].unit}
          value={draft[editing]}
          {...profileBounds(editing)}
          saveLabel={t("profile.save")}
          onSave={(v) => {
            const digits = fields[editing].digits;
            set({ [editing]: Math.round(v * 10 ** digits) / 10 ** digits });
          }}
        />
      )}
      <WhySheet
        open={why !== null}
        onClose={() => setWhy(null)}
        title={whyTitle(why, targets, t, n)}
        hint={t("profile.hint")}
        sections={why === "result" ? resultSections(draft, avgKg, targets, t, n) : splitSections(draft, targets, t, n)}
      />
    </div>
  );
}

type T = ReturnType<typeof useT>["t"];
type N = ReturnType<typeof useT>["n"];

/** Héros kcal/jour puis le détail du calcul en 3 colonnes (Figma « Détail du calcul »). */
function Result({ draft, avgKg, targets }: { draft: Profile; avgKg: number; targets: Targets }) {
  const { t, n } = useT();
  const rest = bmr(draft, avgKg);
  const loss = shownLoss(draft, avgKg, targets.kcal);
  const cols = [
    { value: n(rest), label: t("profile.rest") },
    { value: t("profile.times", { n: n(draft.activity, decimals(draft.activity)) }), label: t("profile.activity-short") },
    { value: t("profile.minus", { n: n(loss) }), label: t("profile.loss") },
  ];
  return (
    <>
      <p className="num mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-heros tracking-[-0.04em]">{n(targets.kcal)}</span>
        <span className="text-valeur text-texte-discret">{t("profile.kcal-day")}</span>
      </p>
      <div className="mt-3 flex">
        {cols.map((c, i) => (
          <div key={c.label} className={i ? "min-w-0 flex-1 border-l border-trait py-3 pl-[14px]" : "min-w-0 flex-1 py-3"}>
            <p className="num text-moyen whitespace-nowrap">{c.value}</p>
            <p className="mt-0.5 text-petit text-texte-discret">{c.label}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function whyTitle(why: Why | null, targets: Targets | null, t: T, n: N): string {
  if (why === "split") return t("profile.why-split.title");
  return targets ? t("profile.why-result.title", { kcal: n(targets.kcal) }) : t("profile.why-result.title-empty");
}

function resultSections(p: Profile, avgKg: number | null, targets: Targets | null, t: T, n: N): WhySection[] {
  const none = t("profile.none");
  const level = RULES.activityLevels.value.indexOf(p.activity);
  const pct = n(RULES.lossPctPerWeek.value * 100, 1);
  return [
    {
      title: t("profile.why-result.rest"),
      item: { mine: true, label: t("profile.why-result.rest-label"), value: avgKg === null ? none : n(bmr(p, avgKg)), text: t("profile.why-result.rest-text") },
    },
    {
      title: t("profile.why-result.activity"),
      item: {
        mine: true,
        label: t(`profile.levels.${level}.label`),
        value: t("profile.times", { n: n(p.activity, decimals(p.activity)) }),
        text: t(`profile.levels.${level}.why`),
      },
    },
    {
      title: t("profile.why-result.goal"),
      item: {
        mine: true,
        label: t("profile.why-result.goal-label"),
        value: avgKg === null || !targets ? none : t("profile.minus", { n: n(shownLoss(p, avgKg, targets.kcal)) }),
        text: t(p.strength ? "profile.why-result.goal-text-on" : "profile.why-result.goal-text-off", { pct }),
      },
    },
    {
      title: t("profile.why-result.adjust"),
      item: {
        mine: true,
        label: t("profile.why-result.adjust-label"),
        value: t("profile.why-result.adjust-value", { n: n(adjustCapOf(p)) }),
        text: t("profile.why-result.adjust-text"),
      },
    },
    {
      title: t("profile.why-result.floor"),
      item: {
        mine: true,
        label: t(`profile.why-result.floor-${p.sex}`),
        value: t("profile.why-result.floor-value", { n: n(KCAL_FLOOR[p.sex]) }),
        text: t(targets?.floorApplied ? "profile.why-result.floor-applied" : "profile.why-result.floor-text"),
      },
    },
  ];
}

function splitSections(p: Profile, targets: Targets | null, t: T, n: N): WhySection[] {
  const g = (v: number | undefined) => (v === undefined ? t("profile.none") : t("profile.g", { n: n(v) }));
  const k = p.strength ? "on" : "off";
  return [
    {
      title: t("profile.why-split.protein"),
      subtitle: t("profile.why-split.protein-role"),
      item: { mine: true, label: t(`profile.why-split.protein-${k}`), value: g(targets?.protein), text: t(`profile.why-split.protein-text-${k}`, { gkg: n(p.proteinGPerKg, 1) }) },
    },
    {
      title: t("profile.why-split.fat"),
      subtitle: t("profile.why-split.fat-role"),
      item: { mine: true, label: t(`profile.why-split.fat-${k}`), value: g(targets?.fat), text: t(`profile.why-split.fat-text-${k}`, { pct: n(p.fatPct * 100) }) },
    },
    {
      title: t("profile.why-split.carbs"),
      subtitle: t("profile.why-split.carbs-role"),
      item: { mine: true, label: t("profile.why-split.carbs-label"), value: g(targets?.carbs), text: t("profile.why-split.carbs-text") },
    },
    {
      title: t("profile.why-split.fiber"),
      item: { mine: true, label: t("profile.why-split.fiber-label"), value: g(p.fiberG), text: t("profile.why-split.fiber-text") },
    },
    {
      title: t("profile.why-split.water"),
      item: { mine: true, label: t("profile.why-split.water-label"), value: t("profile.l", { n: n(p.waterL, 1) }), text: t("profile.why-split.water-text") },
    },
  ];
}
