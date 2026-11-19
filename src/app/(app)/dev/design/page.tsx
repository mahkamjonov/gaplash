import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Check, GraduationCap, MessageCircle, Mic, Sparkles, Trash2 } from "lucide-react";

import { Mascot } from "@/components/brand/mascot";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChoiceCard, ChoiceChip } from "@/components/ui/choice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { SheetDemo } from "./sheet-demo";

export const metadata: Metadata = { title: "Design system", robots: { index: false } };

const swatches = [
  { name: "primary", hex: "#6C63E6", className: "bg-primary" },
  { name: "primary-deep", hex: "#5249C9", className: "bg-primary-deep" },
  { name: "primary-tint", hex: "#E9E7FB", className: "bg-primary-tint" },
  { name: "background", hex: "#FAF9F7", className: "bg-background" },
  { name: "surface", hex: "#FFFFFF", className: "bg-surface" },
  { name: "foreground", hex: "#2B2B2B", className: "bg-foreground" },
  { name: "muted-foreground", hex: "#6B6B76", className: "bg-muted-foreground" },
  { name: "subtle", hex: "#7A7A85", className: "bg-subtle" },
  { name: "warm", hex: "#FFC9A8", className: "bg-warm" },
  { name: "success", hex: "#B8EBD0", className: "bg-success" },
  { name: "destructive", hex: "#8C4A5A", className: "bg-destructive" },
  { name: "border", hex: "#ECE9E4", className: "bg-border" },
];

const typeScale = [
  { name: "display", className: "text-display" },
  { name: "title", className: "text-title" },
  { name: "heading", className: "text-heading" },
  { name: "subheading", className: "text-subheading" },
  { name: "body-lg", className: "text-body-lg" },
  { name: "body", className: "text-body" },
  { name: "small", className: "text-small" },
  { name: "caption", className: "text-caption" },
  { name: "label", className: "text-label" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-subheading">{title}</h2>
      {children}
    </section>
  );
}

/** Dev-only reference for reviewing the design system. Not linked and 404s in production. */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <>
      <PageHeader title="Design system" description="Tokens and base components, for review." />

      <Section title="Color">
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {swatches.map(({ name, hex, className }) => (
            <li key={name} className="flex min-w-0 flex-col gap-2">
              <span className={`h-16 rounded-input border border-border ${className}`} />
              <span className="text-small font-semibold break-words">{name}</span>
              <span className="-mt-2 text-caption text-muted-foreground">{hex} (light)</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type">
        <div className="flex flex-col gap-3">
          {typeScale.map(({ name, className }) => (
            <p key={name} className={`${className} break-words`}>
              {name}: Tayyormisan? O‘zbekcha g‘oya
            </p>
          ))}
          <p className="text-title tabular-nums">01:59 / 11:11</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Boshlash</Button>
          <Button size="md">
            Davom etish
            <ArrowRight />
          </Button>
          <Button size="sm">Kichik</Button>
          <Button loading size="md">
            Yuklanyapti
          </Button>
          <Button disabled size="md">
            O‘chirilgan
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="md">
            Secondary
          </Button>
          <Button variant="outline" size="md">
            Outline
          </Button>
          <Button variant="ghost" size="md">
            Ghost
          </Button>
          <Button variant="destructive" size="md">
            <Trash2 />
            Destructive
          </Button>
          <Button variant="secondary" size="icon" aria-label="Mikrofon">
            <Mic />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Mikrofon">
            <Mic />
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="primary">
            <Sparkles />
            IELTS
          </Badge>
          <Badge tone="success">
            <Check />
            Tayyor
          </Badge>
          <Badge tone="warm">Oxirgi 10 soniya</Badge>
        </div>
      </Section>

      <Section title="Notice">
        <Notice>Internet bilan aloqa yo‘qqa o‘xshaydi. Tekshirib, qayta urinib ko‘r.</Notice>
      </Section>

      <Section title="Choices">
        <fieldset className="grid gap-3 md:grid-cols-2">
          <ChoiceCard name="demo-card" icon={GraduationCap} title="IELTS" description="Tanlangan holat" defaultChecked />
          <ChoiceCard name="demo-card" icon={MessageCircle} title="Erkin suhbat" description="Oddiy holat" />
        </fieldset>
        <fieldset className="grid max-w-sm grid-cols-3 gap-2">
          <ChoiceChip name="demo-chip" defaultChecked>
            <span className="tabular-nums">6.5</span>
          </ChoiceChip>
          <ChoiceChip name="demo-chip">
            <span className="tabular-nums">7.0</span>
          </ChoiceChip>
          <ChoiceChip name="demo-chip">
            <span className="tabular-nums">7.5</span>
          </ChoiceChip>
        </fieldset>
      </Section>

      <Section title="Fields">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="demo-name">Isming</Label>
            <Input id="demo-name" placeholder="Masalan, Malika" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="demo-invalid">Xato holati</Label>
            <Input id="demo-invalid" aria-invalid defaultValue="Xato" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="demo-disabled">O‘chirilgan</Label>
            <Input id="demo-disabled" disabled defaultValue="O‘zgartirib bo‘lmaydi" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="demo-note">Izoh</Label>
            <Textarea id="demo-note" placeholder="Bitta qisqa fikr yoz" />
          </div>
        </div>
      </Section>

      <Section title="Card">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>IELTS mashqi</CardTitle>
              <CardDescription>Ertaga, 19:00</CardDescription>
            </CardHeader>
            <CardContent className="text-body text-muted-foreground">
              Do‘sting bilan Part 1, 2 va 3 ni birga o‘tasan.
            </CardContent>
            <CardFooter>
              <Button size="md" className="w-full">
                Qo‘shilish
              </Button>
            </CardFooter>
          </Card>
          <Card aria-hidden>
            <Skeleton className="h-7 w-1/2" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-12 w-full rounded-pill" />
          </Card>
        </div>
      </Section>

      <Section title="Mascot">
        <div className="flex flex-wrap items-center gap-6">
          <Mascot size={120} title="Default" />
          <Mascot size={120} mood="waving" title="Waving" />
          <Mascot size={120} mood="celebrating" title="Celebrating" />
          <Mascot size={40} />
        </div>
      </Section>

      <Section title="Sheet">
        <div>
          <SheetDemo />
        </div>
      </Section>
    </>
  );
}
