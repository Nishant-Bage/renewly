<script lang="ts">
  import {
    dateLabel,
    nextRenewal,
    money,
    type Subscription,
  } from "#lib/subscriptions.ts";
  let {
    items,
    date,
    onedit,
    ontoggle,
    ondelete,
  }: {
    items: Subscription[];
    date: string;
    onedit: (item: Subscription) => void;
    ontoggle: (item: Subscription) => void;
    ondelete: (item: Subscription) => void;
  } = $props();
</script>

<div class="table-scroll">
  <table>
    <thead
      ><tr
        ><th>Subscription</th><th>Category</th><th>Cost</th><th>Next renewal</th
        ><th>Status</th><th><span class="sr-only">Actions</span></th></tr
      ></thead
    ><tbody>
      {#each items as item (item.id)}<tr
          ><td
            ><div class="service">
              <span class="service-icon"
                >{item.name.slice(0, 1).toUpperCase()}</span
              ><button class="name-button" onclick={() => onedit(item)}
                >{item.name}</button
              >
            </div></td
          ><td><span class="tag">{item.category}</span></td><td
            ><strong>{money(item.price)}</strong><small
              >/ {item.cycle === "yearly" ? "year" : "month"}</small
            ></td
          ><td>{item.active ? dateLabel(nextRenewal(item, date)) : "—"}</td><td
            ><button
              class:paused={!item.active}
              class="status"
              onclick={() => ontoggle(item)}
              aria-label={`${item.active ? "Pause" : "Resume"} ${item.name}`}
              >{item.active ? "● Active" : "Ⅱ Paused"}</button
            ></td
          ><td
            ><div class="row-actions">
              <button
                class="quiet"
                onclick={() => onedit(item)}
                aria-label={`Edit ${item.name}`}>Edit</button
              ><button
                class="quiet delete"
                onclick={() => ondelete(item)}
                aria-label={`Delete ${item.name}`}>×</button
              >
            </div></td
          ></tr
        >{/each}
    </tbody>
  </table>
  {#if !items.length}<p class="empty">
      No subscriptions match your filters.
    </p>{/if}
</div>
