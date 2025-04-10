<script lang="ts">
    import { db } from '$lib/db';
    import { liveQuery } from 'dexie';
    import { writable, derived } from 'svelte/store';
  // ... other imports ...
  
    // Form state
    let newTransaction = {
      type: 'expense' as 'income' | 'expense',
      amount: 0,
      category: '',
      description: '',
      date: new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    };
  
    // Live data
    const transactions = liveQuery(() => db.transactions
      .orderBy('date')
      .reverse()
      .toArray()
    );
  
    // Stats
    $: balance = $transactions?.reduce((sum, t) => 
      t.type === 'income' ? sum + t.amount : sum - t.amount, 0) || 0;
  
    async function addTransaction() {
      await db.transactions.add({
        ...newTransaction,
        date: new Date(newTransaction.date),
        amount: Number(newTransaction.amount)
      });
      newTransaction = { ...newTransaction, amount: 0, description: '' };
    }
  
    async function deleteTransaction(id: number) {
      await db.transactions.delete(id);
    }

    let activeTab: 'transactions' | 'add' | 'stats' = 'transactions';

    const monthlyStats = derived(transactions, ($transactions) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      currentMonth: $transactions
        ?.filter(t => t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear)
        .reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0) || 0,
      
      dailyAverage: $transactions
        ?.filter(t => t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear)
        .reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0) / 
        (now.getDate() || 1) || 0
    };
  });
  </script>
  





  <main class="mobile-view">
    <!-- Header with Balance -->
    <header>
      <h1>💰 Money Tracker</h1>
      <div class="balance-bubble" class:positive={balance >= 0}>
        ${balance >= 0 ? '+' : ''}{balance.toFixed(2)}
      </div>
    </header>
  
    <!-- Tab Navigation -->
    <nav class="tabs">
      <button 
        class:active={activeTab === 'transactions'}
        on:click={() => activeTab = 'transactions'}
      >
        <svg><!-- hamburger icon --></svg>
        History
      </button>
      <button 
        class:active={activeTab === 'add'}
        on:click={() => activeTab = 'add'}
      >
        <svg><!-- plus icon --></svg>
        Add
      </button>
      <button 
        class:active={activeTab === 'stats'}
        on:click={() => activeTab = 'stats'}
      >
        <svg><!-- chart icon --></svg>
        Stats
      </button>
    </nav>
  
    <!-- Tab Content -->
    <div class="tab-content">
      {#if activeTab === 'transactions'}
        <div class="transaction-list">
          {#each $transactions || [] as t (t.id)}
            <div class="transaction-card" class:income={t.type === 'income'}>
              <div class="left">
                <span class="category">{t.category}</span>
                <span class="description">{t.description || 'No description'}</span>
              </div>
              <div class="right">
                <span class="amount">
                  {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                </span>
                <span class="date">
                  {t.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <button class="delete" on:click={() => deleteTransaction(t.id)}>
                ×
              </button>
            </div>
          {:else}
            <div class="empty-state">
              <p>No transactions yet</p>
            </div>
          {/each}
        </div>
  
      {:else if activeTab === 'add'}
        <form class="add-form" on:submit|preventDefault={addTransaction}>
          <div class="toggle-group">
            <button 
              type="button"
              class:active={newTransaction.type === 'income'}
              on:click={() => newTransaction.type = 'income'}
            >
              Income
            </button>
            <button 
              type="button"
              class:active={newTransaction.type === 'expense'}
              on:click={() => newTransaction.type = 'expense'}
            >
              Expense
            </button>
          </div>
  
          <input 
            type="number" 
            bind:value={newTransaction.amount}
            placeholder="0.00"
            step="0.01"
            min="0"
          >
  
          <select bind:value={newTransaction.category}>
            <option value="">Select category</option>
            {#if newTransaction.type === 'income'}
              <option value="Salary">Salary</option>
              <option value="Freelance">Freelance</option>
              <option value="Gift">Gift</option>
            {:else}
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Housing">Housing</option>
              <option value="Entertainment">Entertainment</option>
            {/if}
          </select>
  
          <input 
            type="text" 
            bind:value={newTransaction.description}
            placeholder="Note (optional)"
          >
  
          <input 
            type="date" 
            bind:value={newTransaction.date}
          >
  
          <button type="submit" class="submit-btn">
            {newTransaction.type === 'income' ? 'Add Income' : 'Add Expense'}
          </button>
        </form>
  
        {:else if activeTab === 'stats'}
        <div class="stats-view">
          <div class="chart-placeholder">
            <p>Monthly Spending</p>
          </div>
          <div class="quick-stats">
            <div class="stat-card">
              <span>This Month</span>
              <strong>
                {#if $monthlyStats.currentMonth >= 0}+{/if}
                {$monthlyStats.currentMonth.toFixed(2)}
              </strong>
            </div>
            <div class="stat-card">
              <span>Avg Daily</span>
              <strong>
                {#if $monthlyStats.dailyAverage >= 0}+{/if}
                {$monthlyStats.dailyAverage.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </main>
  
  <style>
    /* Base Styles */
    :global(:root) {
      --income-color: #4CAF50;
      --expense-color: #F44336;
      --primary: #4361ee;
      --bg: #f8f9fa;
      --card-bg: #ffffff;
    }
  
    .mobile-view {
      max-width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      overflow: hidden;
    }
  
    header {
      padding: 1rem;
      background: var(--primary);
      color: white;
      text-align: center;
      position: relative;
    }
  
    .balance-bubble {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: var(--card-bg);
      color: var(--expense-color);
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      font-weight: bold;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
  
    .balance-bubble.positive {
      color: var(--income-color);
    }
  
    /* Tabs */
    .tabs {
      display: flex;
      background: var(--card-bg);
      box-shadow: 0 -2px 5px rgba(0,0,0,0.05);
    }
  
    .tabs button {
      flex: 1;
      padding: 0.75rem;
      border: none;
      background: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      color: #666;
    }
  
    .tabs button.active {
      color: var(--primary);
      font-weight: bold;
    }
  
    /* Transaction List */
    .tab-content {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 3rem;
    }
  
    .transaction-list {
      padding: 0.5rem;
    }
  
    .transaction-card {
      display: flex;
      background: var(--card-bg);
      margin-bottom: 0.5rem;
      border-radius: 0.5rem;
      padding: 1rem;
      position: relative;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
  
    .transaction-card .left {
      flex: 1;
    }
  
    .transaction-card .right {
      text-align: right;
    }
  
    .transaction-card .category {
      font-weight: bold;
      display: block;
    }
  
    .transaction-card .description {
      font-size: 0.8rem;
      color: #666;
    }
  
    .transaction-card .date {
      font-size: 0.8rem;
      color: #999;
      display: block;
    }
  
    .transaction-card.income .amount {
      color: var(--income-color);
      font-weight: bold;
    }
  
    .transaction-card:not(.income) .amount {
      color: var(--expense-color);
      font-weight: bold;
    }
  
    .transaction-card .delete {
      position: absolute;
      right: 0.5rem;
      top: 0.5rem;
      background: none;
      border: none;
      color: #999;
      font-size: 1.2rem;
    }
  
    /* Add Form */
    .add-form {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  
    .toggle-group {
      display: flex;
      border-radius: 0.5rem;
      overflow: hidden;
      border: 1px solid #ddd;
    }
  
    .toggle-group button {
      flex: 1;
      padding: 0.75rem;
      border: none;
      background: #eee;
    }
  
    .toggle-group button.active {
      background: var(--primary);
      color: white;
    }
  
    .add-form input, 
    .add-form select {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      font-size: 1rem;
    }
  
    .submit-btn {
      background: var(--primary);
      color: white;
      padding: 1rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: bold;
      margin-top: 1rem;
    }
  
    /* Stats View */
    .stats-view {
      padding: 1rem;
    }
  
    .chart-placeholder {
      background: var(--card-bg);
      height: 200px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
  
    .quick-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
  
    .stat-card {
      background: var(--card-bg);
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      text-align: center;
    }
  
    .stat-card span {
      font-size: 0.8rem;
      color: #666;
    }
  
    .stat-card strong {
      display: block;
      font-size: 1.2rem;
      margin-top: 0.5rem;
    }
  
    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #999;
    }
  </style>