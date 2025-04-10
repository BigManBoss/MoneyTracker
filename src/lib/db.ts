import Dexie from 'dexie';

interface Transaction {
  id?: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
}

class ExpenseDB extends Dexie {
  transactions!: Dexie.Table<Transaction, number>;

  constructor() {
    super('ExpenseTracker');
    
    this.version(1).stores({
      transactions: '++id, type, amount, category, date'
    });
  }
}

export const db = new ExpenseDB();