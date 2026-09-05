const CATEGORY_META = {
  "Food & Dining": { icon: "utensils", color: "#17a558" },
  Transportation: { icon: "car", color: "#3b82f6" },
  "Bills & Utilities": { icon: "receipt", color: "#f2b705" },
  Shopping: { icon: "shopping-bag", color: "#8b5cf6" },
  Health: { icon: "heart-pulse", color: "#ec4899" },
  Education: { icon: "book-open", color: "#06b6d4" },
  Entertainment: { icon: "film", color: "#ef4444" },
  Others: { icon: "more-horizontal", color: "#475569" },
  Other: { icon: "more-horizontal", color: "#475569" },
  Salary: { icon: "briefcase", color: "#17a558" },
  Freelance: { icon: "laptop", color: "#3b82f6" },
  Business: { icon: "building-2", color: "#8b5cf6" },
  Allowance: { icon: "wallet", color: "#f2b705" },
  Gift: { icon: "gift", color: "#ec4899" },
  "Other Income": { icon: "more-horizontal", color: "#475569" },
};

const FALLBACK_PALETTE = [
  "#17a558",
  "#3b82f6",
  "#f2b705",
  "#8b5cf6",
  "#ef4444",
  "#475569",
  "#06b6d4",
  "#ec4899",
];

function metaFor(cat) {
  return (
    CATEGORY_META[cat] || {
      icon: "circle",
      color: FALLBACK_PALETTE[Math.abs(hash(cat)) % FALLBACK_PALETTE.length],
    }
  );
}

function hash(s) {
  let h = 0;

  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }

  return h;
}

const CATS = {
  expense: [
    "Food & Dining",
    "Transportation",
    "Bills & Utilities",
    "Shopping",
    "Health",
    "Education",
    "Entertainment",
    "Others",
  ],

  income: [
    "Salary",
    "Freelance",
    "Business",
    "Allowance",
    "Gift",
    "Other Income",
  ],
};

/* =========================================================
   APPLICATION STATE
========================================================= */

let type = "expense";

/*
   IMPORTANT:
   The dashboard starts EMPTY.
   There is NO SEED_ITEMS here.
*/
let items = [];

let editingId = null;

const STORAGE_KEY = "greenledger_transactions_v1";

/* =========================================================
   LOCAL STORAGE
========================================================= */

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadStoredItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw === null) {
      // First visit = completely empty dashboard
      items = [];
    } else {
      items = JSON.parse(raw);

      // Safety check
      if (!Array.isArray(items)) {
        items = [];
      }
    }
  } catch (e) {
    console.error("Could not load transactions:", e);
    items = [];
  }
}

/* =========================================================
   HELPERS
========================================================= */

function nextId() {
  return items.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
}

const $ = (id) => document.getElementById(id);

const peso = (n) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(n) || 0);

const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function toast(message) {
  const t = $("toast");

  if (!t) return;

  t.textContent = message;

  t.classList.add("show");

  setTimeout(() => {
    t.classList.remove("show");
  }, 2200);
}

function icons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

function today() {
  const d = new Date();
  const o = d.getTimezoneOffset();

  return new Date(d.getTime() - o * 60000).toISOString().slice(0, 10);
}

/* =========================================================
   CATEGORY
========================================================= */

function refreshCategoryOptions() {
  const category = $("category");

  if (!category) return;

  category.innerHTML = CATS[type]
    .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
    .join("");

  updateCategoryIcon();
}

function updateCategoryIcon() {
  const category = $("category");

  if (!category) return;

  const cat = category.value || CATS[type][0];

  const meta = metaFor(cat);

  const icon = $("category-icon");

  if (!icon) return;

  icon.innerHTML = `<i data-lucide="${meta.icon}"></i>`;

  icon.style.color = meta.color;

  icons();
}

function chooseType(t) {
  type = t;

  document.querySelectorAll(".type-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.type === t);
  });

  refreshCategoryOptions();
}

/* =========================================================
   LOAD EVERYTHING
========================================================= */

function load() {
  loadStoredItems();

  renderTable();
  renderStats();
  renderPie();
  renderCategories();
}

/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function renderStats() {
  const income = items
    .filter((x) => x.type === "income")
    .reduce((sum, x) => sum + Number(x.amount), 0);

  const expense = items
    .filter((x) => x.type === "expense")
    .reduce((sum, x) => sum + Number(x.amount), 0);

  const balance = income - expense;

  if ($("stat-income")) {
    $("stat-income").textContent = peso(income);
  }

  if ($("stat-expense")) {
    $("stat-expense").textContent = peso(expense);
  }

  if ($("stat-balance")) {
    $("stat-balance").textContent = peso(balance);
  }

  if ($("stat-count")) {
    $("stat-count").textContent = items.length;
  }
}

/* =========================================================
   PIE CHART
========================================================= */

function renderPie() {
  const totals = {};

  items
    .filter((x) => x.type === "expense")
    .forEach((x) => {
      totals[x.category] = (totals[x.category] || 0) + Number(x.amount);
    });

  const cats = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  const grandTotal = cats.reduce((sum, [, value]) => sum + value, 0);

  if (!cats.length) {
    if ($("pie-wrap")) {
      $("pie-wrap").classList.add("hidden");
    }

    if ($("pie-empty")) {
      $("pie-empty").classList.remove("hidden");
    }

    icons();

    return;
  }

  if ($("pie-wrap")) {
    $("pie-wrap").classList.remove("hidden");
  }

  if ($("pie-empty")) {
    $("pie-empty").classList.add("hidden");
  }

  let angle = 0;

  const stops = cats
    .map(([cat, val]) => {
      const meta = metaFor(cat);

      const pct = (val / grandTotal) * 100;

      const start = angle;

      const end = angle + pct;

      angle = end;

      return `${meta.color} ${start}% ${end}%`;
    })
    .join(", ");

  if ($("pie")) {
    $("pie").style.background = `conic-gradient(${stops})`;
  }

  if ($("legend")) {
    $("legend").innerHTML = cats
      .map(([cat, val]) => {
        const meta = metaFor(cat);

        const pct = Math.round((val / grandTotal) * 100);

        return `
            <li>
              <span
                class="dot"
                style="background:${meta.color}"
              ></span>

              <span class="name">
                ${esc(cat)}
              </span>

              <span class="pct">
                ${pct}%
              </span>

              <span class="amt">
                ${peso(val)}
              </span>
            </li>
          `;
      })
      .join("");
  }
}

/* =========================================================
   CATEGORY GRID
========================================================= */

function renderCategories() {
  const all = [...CATS.expense, ...CATS.income];

  if (!$("categoryGrid")) {
    return;
  }

  $("categoryGrid").innerHTML = all
    .map((cat) => {
      const meta = metaFor(cat);

      return `
          <div class="category-chip">

            <span
              class="cat-icon"
              style="background:${meta.color}"
            >
              <i data-lucide="${meta.icon}"></i>
            </span>

            <span>
              ${esc(cat)}
            </span>

          </div>
        `;
    })
    .join("");

  icons();
}

/* =========================================================
   FILTER
========================================================= */

function currentFilter() {
  const active = document.querySelector(".pill.active");

  return active ? active.dataset.filter : "all";
}

/* =========================================================
   TRANSACTION TABLE
========================================================= */

function renderTable() {
  const filter = currentFilter();

  const shown = items.filter((x) => filter === "all" || x.type === filter);

  const list = $("list");

  if (!list) {
    return;
  }

  if ($("emptyTransactions")) {
    $("emptyTransactions").classList.toggle("hidden", shown.length > 0);
  }

  const tableWrap = list.closest(".table-wrap");

  if (tableWrap) {
    tableWrap.classList.toggle("hidden", shown.length === 0);
  }

  list.innerHTML = shown
    .map((x) => {
      const meta = metaFor(x.category);

      const dateLabel = new Date(
        x.transaction_date + "T00:00:00",
      ).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const badge =
        x.type === "income"
          ? `
              <span
                class="type-badge income"
              >
                <i
                  data-lucide="arrow-up"
                ></i>
                Income
              </span>
            `
          : `
              <span
                class="type-badge expense"
              >
                <i
                  data-lucide="arrow-down"
                ></i>
                Expense
              </span>
            `;

      const amount =
        x.type === "income"
          ? `
              <span class="amt-income">
                +${peso(x.amount)}
              </span>
            `
          : `
              <span class="amt-expense">
                -${peso(x.amount)}
              </span>
            `;

      return `
          <tr>

            <td>
              ${dateLabel}
            </td>

            <td>
              ${badge}
            </td>

            <td>
              <div class="cat-cell">

                <span
                  class="cat-icon"
                  style="background:${meta.color}"
                >
                  <i
                    data-lucide="${meta.icon}"
                  ></i>
                </span>

                ${esc(x.category)}

              </div>
            </td>

            <td>
              ${esc(x.title)}
            </td>

            <td class="right">
              ${amount}
            </td>

            <td class="right">

              <div class="row-actions">

                <button
                  class="icon-btn edit"
                  data-id="${x.id}"
                  title="Edit"
                >
                  <i
                    data-lucide="pencil"
                  ></i>
                </button>

                <button
                  class="icon-btn del"
                  data-id="${x.id}"
                  title="Delete"
                >
                  <i
                    data-lucide="trash-2"
                  ></i>
                </button>

              </div>

            </td>

          </tr>
        `;
    })
    .join("");

  /* DELETE BUTTONS */

  document.querySelectorAll(".icon-btn.del").forEach((button) => {
    button.onclick = async () => {
      if (confirm("Delete this transaction?")) {
        items = items.filter((x) => String(x.id) !== String(button.dataset.id));

        saveItems();

        toast("Transaction deleted.");

        if (editingId == button.dataset.id) {
          exitEdit();
        }

        load();
      }
    };
  });

  /* EDIT BUTTONS */

  document.querySelectorAll(".icon-btn.edit").forEach((button) => {
    button.onclick = () => startEdit(button.dataset.id);
  });

  icons();
}

/* =========================================================
   EDIT TRANSACTION
========================================================= */

function startEdit(id) {
  const item = items.find((i) => String(i.id) === String(id));

  if (!item) {
    return;
  }

  editingId = item.id;

  chooseType(item.type);

  $("amount").value = item.amount;

  $("category").value = item.category;

  updateCategoryIcon();

  $("date").value = item.transaction_date;

  $("title").value = item.title;

  $("submitBtn").innerHTML = '<i data-lucide="check"></i>Update Transaction';

  $("cancelEdit").classList.remove("hidden");

  icons();

  $("add").scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

/* =========================================================
   EXIT EDIT MODE
========================================================= */

function exitEdit() {
  editingId = null;

  $("form").reset();

  $("date").value = today();

  chooseType("expense");

  $("submitBtn").innerHTML = '<i data-lucide="send"></i>Add Transaction';

  $("cancelEdit").classList.add("hidden");

  icons();
}

/* =========================================================
   ADD / UPDATE TRANSACTION
========================================================= */

$("form").onsubmit = async (e) => {
  e.preventDefault();

  const body = {
    type,

    title: $("title").value.trim(),

    amount: $("amount").value,

    date: $("date").value,

    category: $("category").value,
  };

  if (!body.title || !body.category || Number(body.amount) <= 0 || !body.date) {
    return toast("Please provide valid transaction details.");
  }

  /* UPDATE */

  if (editingId) {
    const index = items.findIndex((x) => String(x.id) === String(editingId));

    if (index < 0) {
      return toast("Transaction not found.");
    }

    items[index] = {
      ...items[index],

      type: body.type,

      title: body.title,

      amount: Number(body.amount),

      transaction_date: body.date,

      category: body.category,
    };
  } else {

  /* ADD NEW */
    items.push({
      id: nextId(),

      type: body.type,

      title: body.title,

      amount: Number(body.amount),

      transaction_date: body.date,

      category: body.category,

      created_at: new Date().toISOString(),
    });
  }

  saveItems();

  toast(editingId ? "Transaction updated." : "Transaction added.");

  exitEdit();

  load();
};

/* =========================================================
   CANCEL EDIT
========================================================= */

$("cancelEdit").onclick = exitEdit;

/* =========================================================
   INCOME / EXPENSE BUTTONS
========================================================= */

document.querySelectorAll(".type-btn").forEach((button) => {
  button.onclick = () => chooseType(button.dataset.type);
});

/* =========================================================
   CATEGORY CHANGE
========================================================= */

$("category").onchange = updateCategoryIcon;

/* =========================================================
   TRANSACTION FILTERS
========================================================= */

document.querySelectorAll(".pill").forEach((button) => {
  button.onclick = () => {
    document
      .querySelectorAll(".pill")
      .forEach((pill) => pill.classList.remove("active"));

    button.classList.add("active");

    renderTable();
  };
});

/* =========================================================
   CLEAR ALL TRANSACTIONS
========================================================= */

$("clear").onclick = async () => {
  if (items.length && confirm("Delete all transactions?")) {
    items = [];

    saveItems();

    toast("All transactions cleared.");

    exitEdit();

    load();
  }
};

/* =========================================================
   NAVIGATION
========================================================= */

document.querySelectorAll(".nav-link").forEach((link) => {
  link.onclick = (e) => {
    document
      .querySelectorAll(".nav-link")
      .forEach((x) => x.classList.remove("active"));

    link.classList.add("active");
  };
});

/* =========================================================
   INITIALIZE
========================================================= */

if ($("today-label")) {
  $("today-label").textContent = new Date().toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

if ($("date")) {
  $("date").value = today();
}

chooseType("expense");

icons();

load();
