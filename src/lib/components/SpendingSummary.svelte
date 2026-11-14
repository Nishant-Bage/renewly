<script lang="ts">
  import {
    categories,
    monthly,
    money,
    type Subscription,
  } from "#lib/subscriptions.ts";
  let { items }: { items: Subscription[] } = $props();
  let total = $derived(items.reduce((sum, item) => sum + monthly(item), 0));
  let groups = $derived(
    categories
      .map((name) => ({
        name,
        value: items
          .filter((item) => item.category === name)
          .reduce((sum, item) => sum + monthly(item), 0),
      }))
      .filter((group) => group.value > 0)
      .sort((a, b) => b.value - a.value),
  );
</script>

<section class="panel breakdown">
  <div class="section-title">
    <h2>Where it goes</h2>
    <span class="muted">Monthly equivalent</span>
  </div>
  {#if groups.length === 0}<p class="empty">
      Your category breakdown will appear here.
    </p>{/if}
  {#each groups as group, i}<div class="category-row">
      <div>
        <span class="dot tone-{i}"></span><span>{group.name}</span><strong
          >{money(group.value)}</strong
        >
      </div>
      <div class="track">
        <div
          class="fill tone-{i}"
          style:width={`${(group.value / total) * 100}%`}
        ></div>
      </div>
    </div>{/each}
  <p class="note">
    Annual plans are divided by 12. This is a spending estimate, not a payment
    history.
  </p>
</section>
