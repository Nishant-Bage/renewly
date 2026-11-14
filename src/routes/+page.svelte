<script lang="ts">
  import { onMount } from "svelte";
  import "../app.css";
  import SubscriptionForm from "#lib/components/SubscriptionForm.svelte";
  import SpendingSummary from "#lib/components/SpendingSummary.svelte";
  import SubscriptionTable from "#lib/components/SubscriptionTable.svelte";
  import {
    categories,
    today,
    money,
    monthly,
    nextRenewal,
    daysUntil,
    dateLabel,
    sampleLibrary,
    parseLibrary,
    storageKey,
    type Subscription,
    type Library,
  } from "#lib/subscriptions.ts";
  let library = $state<Library>({ version: 1, demo: false, items: [] });
  let ready = $state(false);
  let date = $state("");
  let search = $state("");
  let category = $state("");
  let status = $state("all");
  let sort = $state("renewal");
  let editing = $state<Subscription | null>(null);
  let showForm = $state(false);
  let message = $state("");
  let error = $state("");
  let loadBlocked = $state(false);
  let removed = $state<Subscription | null>(null);
  let importInput = $state<HTMLInputElement>();
  let pendingImport = $state<Library | null>(null);
  let confirmClear = $state(false);
  onMount(() => {
    date = today();
    try {
      const raw = localStorage.getItem(storageKey);
      library = raw === null ? sampleLibrary(date) : parseLibrary(raw);
    } catch {
      loadBlocked = true;
      error =
        "Saved data could not be loaded. It has not been overwritten. You can restore a backup or explicitly start fresh.";
    }
    ready = true;
    const timer = setInterval(() => (date = today()), 60000);
    return () => clearInterval(timer);
  });
  function save(next: Library, recovery = false) {
    if (loadBlocked && !recovery) {
      error =
        "Restore a backup or explicitly start fresh before making changes. Existing saved data has been preserved.";
      return false;
    }
    try {
      parseLibrary(JSON.stringify(next));
      localStorage.setItem(storageKey, JSON.stringify(next));
      library = next;
      loadBlocked = false;
      error = "";
      return true;
    } catch {
      error =
        "Could not save to browser storage. Your change was not applied. Export a backup or free some space and retry.";
      return false;
    }
  }
  function saveItem(item: Subscription) {
    const items = library.items.some((row) => row.id === item.id)
      ? library.items.map((row) => (row.id === item.id ? item : row))
      : [...library.items, item];
    if (items.length > 1000) {
      error = "The library supports up to 1,000 subscriptions.";
      return;
    }
    if (save({ ...library, items })) {
      showForm = false;
      message = `${item.name} saved.`;
    }
  }
  function remove(item: Subscription) {
    if (
      save({
        ...library,
        items: library.items.filter((row) => row.id !== item.id),
      })
    ) {
      removed = item;
      message = `${item.name} deleted.`;
    }
  }
  function undo() {
    if (removed && save({ ...library, items: [...library.items, removed] })) {
      removed = null;
      message = "Subscription restored.";
    }
  }
  function exportBackup() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(library, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `renewly-${date}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importBackup(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000)
        throw new Error("Choose a backup smaller than 2 MB.");
      pendingImport = parseLibrary(await file.text());
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Could not read backup.";
    } finally {
      input.value = "";
    }
  }
  let active = $derived(library.items.filter((item) => item.active));
  let total = $derived(active.reduce((sum, item) => sum + monthly(item), 0));
  let upcoming = $derived(
    date
      ? active
          .map((item) => ({ ...item, next: nextRenewal(item, date) }))
          .sort((a, b) => a.next.localeCompare(b.next))
      : [],
  );
  let due = $derived(
    upcoming.filter((item) => daysUntil(item.next, date) < 30),
  );
  let visible = $derived.by(() =>
    library.items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) &&
          (!category || item.category === category) &&
          (status === "all" || item.active === (status === "active")),
      )
      .sort((a, b) =>
        sort === "cost"
          ? monthly(b) - monthly(a)
          : sort === "name"
            ? a.name.localeCompare(b.name)
            : nextRenewal(a, date || today()).localeCompare(
                nextRenewal(b, date || today()),
              ),
      ),
  );
</script>

<svelte:head
  ><title>Renewly — Your subscriptions, in perspective</title><meta
    name="description"
    content="A local subscription dashboard for tracking recurring expenses and upcoming renewals."
  /></svelte:head
>
<a class="skip" href="#main">Skip to dashboard</a>
<div class="shell">
  <aside>
    <a href="#main" class="brand"
      ><span class="brand-mark">r.</span>renewly<span class="brand-period"
        >✦</span
      ></a
    >
    <p class="nav-label">YOUR WORKSPACE</p>
    <a href="#main" class="nav-item selected">◫ <span>Overview</span></a><a
      href={ready ? "#subscriptions" : "#main"}
      class="nav-item"
      >▤ <span>Subscriptions</span><b>{library.items.length}</b></a
    ><a href={ready ? "#renewals" : "#main"} class="nav-item"
      >◷ <span>Upcoming renewals</span></a
    >
    <div class="sidebar-bottom">
      <div class="local-icon">⌁</div>
      <strong>A little more clarity.</strong>
      <p>One place for everything<br />you pay for, on repeat.</p>
      <span class="local-badge">● Stored on your device</span>
    </div>
    <div class="profile">
      <span>NB</span>
      <div>Personal workspace<small>INR · Local storage</small></div>
    </div>
  </aside>
  <div class="workspace">
    <header>
      <span
        >Workspace <span class="slash">/</span> <strong>Overview</strong></span
      >
      <div>
        <span class="date"
          >{date
            ? new Intl.DateTimeFormat("en-IN", {
                month: "long",
                year: "numeric",
              }).format(new Date(date))
            : ""}</span
        ><span class="avatar">NB</span>
      </div>
    </header>
    <main id="main">
      <div class="page-title">
        <div>
          <span class="eyebrow">LESS GUESSWORK. MORE CONTROL.</span>
          <h1>Your subscriptions, <em>in perspective.</em></h1>
          <p>Keep an eye on what’s recurring. Make room for what matters.</p>
        </div>
        <button
          class="primary"
          disabled={!ready}
          onclick={() => {
            editing = null;
            showForm = true;
          }}>＋ Add subscription</button
        >
      </div>
      {#if library.demo}<div class="demo-banner">
          <span
            ><strong>Sample workspace</strong> · Illustrative INR amounts, not current
            service prices.</span
          ><button class="quiet" onclick={() => (confirmClear = true)}
            >Start with my own data ↗</button
          >
        </div>{/if}
      {#if error}<div class="error notice" role="alert">
          {error}<button class="quiet" onclick={() => (confirmClear = true)}
            >Start fresh</button
          >
        </div>{/if}
      {#if message}<div class="notice" role="status">
          {message}{#if removed}<button class="quiet" onclick={undo}
              >Undo delete</button
            >{/if}
        </div>{/if}
      {#if confirmClear}<section class="panel notice">
          <p>
            Start an empty workspace? This replaces the current list. Export a
            backup first if you want to keep it.
          </p>
          <button
            class="primary"
            onclick={() => {
              if (save({ version: 1, demo: false, items: [] }, true)) {
                confirmClear = false;
                removed = null;
                showForm = false;
                message = "Your workspace is ready.";
              }
            }}>Start empty</button
          ><button class="quiet" onclick={() => (confirmClear = false)}
            >Cancel</button
          >
        </section>{/if}
      {#if pendingImport}<section class="panel notice">
          <p>
            Replace your library with {pendingImport.items.length} subscriptions from
            this backup?
          </p>
          <button
            class="primary"
            onclick={() => {
              if (pendingImport && save(pendingImport, true)) {
                pendingImport = null;
                removed = null;
                showForm = false;
                message = "Backup restored.";
              }
            }}>Replace library</button
          ><button class="quiet" onclick={() => (pendingImport = null)}
            >Cancel</button
          >
        </section>{/if}
      {#if showForm}{#key editing?.id}<SubscriptionForm
            item={editing}
            onsave={saveItem}
            onclose={() => (showForm = false)}
          />{/key}{/if}
      {#if !ready}<p class="empty" role="status">
          Loading your workspace…
        </p>{:else}
        <section class="metrics" aria-label="Spending summary">
          <article class="metric featured">
            <span>Monthly equivalent <b>↗</b></span><strong
              >{money(total)}</strong
            ><small>Across {active.length} active subscriptions</small>
            <div class="metric-decoration" aria-hidden="true">≈</div>
          </article>
          <article class="metric">
            <span>Annual estimate <b>◴</b></span><strong
              >{money(total * 12)}</strong
            ><small>At your current subscription rates</small>
          </article>
          <article class="metric">
            <span>Next 30 days <b>◷</b></span><strong
              >{money(due.reduce((sum, item) => sum + item.price, 0))}</strong
            ><small>{due.length} next renewals coming up</small>
          </article>
        </section>
        <div class="insights">
          <SpendingSummary items={library.items} />
          <section id="renewals" class="panel renewals">
            <div class="section-title">
              <h2>Coming up next</h2>
              <span class="muted">Next 30 days</span>
            </div>
            {#each due.slice(0, 4) as item}<div class="renewal">
                <span class="date-box"
                  >{dateLabel(item.next).split(" ")[0]}<small
                    >{dateLabel(item.next).split(" ")[1]}</small
                  ></span
                >
                <div>
                  <strong>{item.name}</strong><small
                    >{daysUntil(item.next, date) === 0
                      ? "Renews today"
                      : `In ${daysUntil(item.next, date)} days`}</small
                  >
                </div>
                <b>{money(item.price)}</b>
              </div>{/each}{#if !due.length}<p class="empty">
                Nothing due in the next 30 days.
              </p>{/if}{#if due.length > 4}<p class="note">
                + {due.length - 4} more in your subscription list.
              </p>{/if}
            <p class="note">
              Based on your saved billing dates. No bank connection.
            </p>
          </section>
        </div>
        <section id="subscriptions" class="panel subscriptions">
          <div class="section-title">
            <h2>
              All subscriptions <span class="count">{library.items.length}</span
              >
            </h2>
            <div class="backup-actions">
              <button class="quiet" onclick={() => importInput?.click()}
                >Restore backup ↑</button
              ><button class="quiet" onclick={exportBackup}>Export ↓</button
              ><input
                bind:this={importInput}
                type="file"
                accept="application/json,.json"
                hidden
                onchange={importBackup}
                aria-label="Choose backup"
              />
            </div>
          </div>
          <div class="filters">
            <label class="search"
              ><span class="sr-only">Search subscriptions</span><input
                bind:value={search}
                placeholder="Search subscriptions…"
                type="search"
              /></label
            ><label
              ><span class="sr-only">Category</span><select
                bind:value={category}
                ><option value="">All categories</option
                >{#each categories as name}<option>{name}</option
                  >{/each}</select
              ></label
            ><label
              ><span class="sr-only">Status</span><select bind:value={status}
                ><option value="all">All statuses</option><option value="active"
                  >Active</option
                ><option value="paused">Paused</option></select
              ></label
            ><label
              ><span class="sr-only">Sort subscriptions</span><select
                bind:value={sort}
                ><option value="renewal">Next renewal</option><option
                  value="cost">Highest monthly cost</option
                ><option value="name">Name A–Z</option></select
              ></label
            >
          </div>
          <SubscriptionTable
            items={visible}
            {date}
            onedit={(item) => {
              editing = item;
              showForm = true;
            }}
            ontoggle={(item) => saveItem({ ...item, active: !item.active })}
            ondelete={remove}
          />
          <div class="table-footer">
            Showing {visible.length} of {library.items.length} subscriptions<span
              >All amounts in INR</span
            >
          </div>
        </section>
      {/if}
      <footer>
        Made for a more intentional everyday.<span
          >Renewly · Your data stays in this browser</span
        >
      </footer>
    </main>
  </div>
</div>
