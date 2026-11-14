<script lang="ts">
  import { untrack } from "svelte";
  import {
    categories,
    today,
    validate,
    type Subscription,
    type Category,
  } from "#lib/subscriptions.ts";
  let {
    item,
    onsave,
    onclose,
  }: {
    item: Subscription | null;
    onsave: (item: Subscription) => void;
    onclose: () => void;
  } = $props();
  // The parent keys this editor by ID; draft values intentionally start once.
  const initial = untrack(() => item);
  let name = $state(initial?.name ?? "");
  let price = $state<number | undefined>(initial?.price);
  let cycle = $state<"monthly" | "yearly">(initial?.cycle ?? "monthly");
  let category = $state<Category>(initial?.category ?? "Productivity");
  let anchor = $state(initial?.anchor ?? today());
  let error = $state("");
  function submit(event: SubmitEvent) {
    event.preventDefault();
    try {
      const value = validate({
        id: item?.id ?? crypto.randomUUID(),
        name: name.trim(),
        price: Math.round(Number(price) * 100) / 100,
        cycle,
        category,
        anchor,
        active: item?.active ?? true,
      });
      onsave(value);
    } catch (cause) {
      error =
        cause instanceof Error ? cause.message : "Could not save subscription.";
    }
  }
</script>

<section class="editor panel" aria-labelledby="form-title">
  <div class="section-title">
    <div>
      <span class="eyebrow">MAKE IT YOURS</span>
      <h2 id="form-title">
        {item ? "Edit subscription" : "Add a subscription"}
      </h2>
    </div>
    <button class="quiet" onclick={onclose}>Close ✕</button>
  </div>
  <form onsubmit={submit}>
    <div class="form-grid">
      <label
        >Service name<input
          bind:value={name}
          required
          maxlength="80"
          placeholder="e.g. Adobe Creative Cloud"
        /></label
      >
      <label
        >Price (INR)<input
          bind:value={price}
          type="number"
          min="0.01"
          max="10000000"
          step="0.01"
          required
          placeholder="499"
        /></label
      >
      <label
        >Billing cycle<select bind:value={cycle}
          ><option value="monthly">Monthly</option><option value="yearly"
            >Yearly</option
          ></select
        ></label
      >
      <label
        >Category<select bind:value={category}
          >{#each categories as value}<option>{value}</option>{/each}</select
        ></label
      >
      <label
        >Billing anchor date<input
          bind:value={anchor}
          type="date"
          required
        /></label
      >
    </div>
    <p class="muted">
      Choose a known billing date. Future renewals follow that day, with short
      months adjusted automatically.
    </p>
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <button class="primary" type="submit"
      >{item ? "Save changes" : "Add subscription"}</button
    >
  </form>
</section>
