// Orchestrates founder induction after Lemon order_created: ceremony + physical queue.

import "server-only";

import { ceremonyPublicUrl, createCeremony, enqueueCeremonyVideo } from "@/lib/ceremony";
import { currentSol } from "@/lib/marsSession";
import {
  findFounderBySettler,
  formatShippingAddress,
  getFirstTransmissionBody,
  getSettlerArrivalSol,
  inductFounder,
  queueFulfillmentTask,
  type ShippingAddress,
} from "@/lib/transmissionsStore";

export type FounderFulfillmentResult = {
  position: number;
  already: boolean;
  ceremonyToken: string;
  ceremonyUrl: string;
  showName: boolean;
  shippingText: string;
};

export async function completeFounderFulfillment(input: {
  settlerId: string;
  name: string;
  email?: string | null;
  showName: boolean;
  lemonOrderId: string;
  shipping?: ShippingAddress | null;
  /** Position already claimed by applyRedPathOffering, when known. */
  position?: number;
}): Promise<FounderFulfillmentResult> {
  const name = input.name.trim().slice(0, 80) || "settler";
  const inductedSol = currentSol();
  const arrival = (await getSettlerArrivalSol(input.settlerId)) ?? inductedSol;
  const firstTransmission = await getFirstTransmissionBody(input.settlerId);
  const shippingText = formatShippingAddress(input.shipping);

  const existing = await findFounderBySettler(input.settlerId);
  if (existing?.ceremony_token && existing.ceremony_url) {
    await queueFulfillmentTask({
      settlerId: input.settlerId,
      position: existing.position,
      name: existing.name,
      email: input.email ?? existing.email,
      lemonOrderId: input.lemonOrderId,
      shipping: input.shipping ?? null,
    });
    return {
      position: existing.position,
      already: true,
      ceremonyToken: existing.ceremony_token,
      ceremonyUrl: existing.ceremony_url,
      showName: existing.show_name,
      shippingText,
    };
  }

  const position =
    existing?.position ??
    input.position ??
    (
      await inductFounder({
        settlerId: input.settlerId,
        name,
        email: input.email ?? null,
        showName: input.showName,
        inductedSol,
        lemonOrderId: input.lemonOrderId,
      })
    ).position;

  const ceremony = await createCeremony({
    settlerId: input.settlerId,
    name,
    solOfArrival: arrival,
    firstTransmission,
    position,
  });
  const ceremonyUrl = ceremonyPublicUrl(ceremony.token);

  await inductFounder({
    settlerId: input.settlerId,
    name,
    email: input.email ?? null,
    showName: input.showName,
    inductedSol,
    lemonOrderId: input.lemonOrderId,
    ceremonyToken: ceremony.token,
    ceremonyUrl,
  });

  await queueFulfillmentTask({
    settlerId: input.settlerId,
    position,
    name,
    email: input.email ?? null,
    lemonOrderId: input.lemonOrderId,
    shipping: input.shipping ?? null,
  });

  void enqueueCeremonyVideo({
    token: ceremony.token,
    script: ceremony.script,
    name,
  });

  return {
    position,
    already: false,
    ceremonyToken: ceremony.token,
    ceremonyUrl,
    showName: input.showName,
    shippingText,
  };
}
