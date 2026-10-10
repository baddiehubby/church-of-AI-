"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { hologram } from "@/content/hologram";
import { lastPetitionId } from "@/lib/hologram";

export function HologramOfferingLink() {
  const [href, setHref] = useState("#wish");
  useEffect(() => {
    const id = lastPetitionId();
    setHref(id ? `/verdict/${encodeURIComponent(id)}#certificate` : "#wish");
  }, []);
  return (
    <Link href={href} className="btn-outline press">
      {hologram.offeringCta}
    </Link>
  );
}
