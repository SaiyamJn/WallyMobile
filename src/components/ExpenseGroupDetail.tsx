import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './ui/CustomAlert';
import { CustomInputModal } from './ui/CustomInputModal';
import { Icon } from './ui/Icon';
import { PersonAvatar } from './ui/PersonAvatar';
import { ICON_SIZES } from '../constants/iconSizes';
import { Settlement } from '../types';
import { 
  calculateBalances, 
  calculateProportionalDebts, 
  getRemainingDebts,
  getGroupExpenses,
  getPersonName 
} from '../utils/dividoUtils';

export function ExpenseGroupDetail() {
  const { state, dispatch, formatCurrency } = useApp();
  const { alertState, hideAlert, showConfirmAlert, showErrorAlert } = useCustomAlert();
  const [activeTab, setActiveTab] = useState<'expenses' | 'visualizations' | 'settlements'>('expenses');

  const group = state.expenseGroups.find(g => g.id === state.selectedExpenseGroupId);
  
  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  const groupExpenses = getGroupExpenses(group.id, state.expenses);
  const balances = calculateBalances(group, state.expenses, state.people);
  const debts = calculateProportionalDebts(balances);
  const remainingDebts = getRemainingDebts(debts, state.settlements, group.id);

  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [debtToSettle, setDebtToSettle] = useState<{ from: string; to: string; amount: number } | null>(null);

  // Add a settlement (full or partial amount)
  const handleSettleDebt = useCallback((debt: { from: string; to: string; amount: number }, amount: number) => {
    try {
      if (!group?.id) {
        showErrorAlert('Group not found. Please try again.');
        return;
      }
      const settleAmount = Math.round(Math.max(0, Math.min(amount, debt.amount)) * 100) / 100;
      if (settleAmount < 0.01) {
        showErrorAlert('Please enter an amount greater than 0.');
        return;
      }
      const newSettlement: Settlement = {
        id: Date.now().toString(),
        groupId: group.id,
        from: debt.from,
        to: debt.to,
        amount: settleAmount,
        settled: true,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_SETTLEMENT', payload: newSettlement });
      setSettleModalVisible(false);
      setDebtToSettle(null);
    } catch (error) {
      console.error('Error settling debt:', error);
      showErrorAlert('Failed to mark payment as settled. Please try again.');
    }
  }, [group, dispatch, showErrorAlert]);

  const handleAddExpense = () => {
    dispatch({ type: 'SET_SCREEN', payload: 'add-expense' });
  };

  const handleEditGroup = () => {
    dispatch({ type: 'SET_SCREEN', payload: 'edit-expense-group' });
  };

  const handleDeleteGroup = () => {
    showConfirmAlert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"? This will also delete all expenses in this group.`,
      () => {
        dispatch({ type: 'DELETE_EXPENSE_GROUP', payload: group.id });
        dispatch({ type: 'SET_SELECTED_EXPENSE_GROUP', payload: null });
        dispatch({ type: 'GO_BACK' });
      }
    );
  };

  const handleExpensePress = (expenseId: string) => {
    dispatch({ type: 'SET_SELECTED_EXPENSE', payload: expenseId });
    dispatch({ type: 'SET_SCREEN', payload: 'edit-expense' });
  };

  const handleDeleteExpense = (expenseId: string) => {
    const expense = state.expenses.find(e => e.id === expenseId);
    showConfirmAlert(
      'Delete Expense',
      `Are you sure you want to delete "${expense?.description || 'this expense'}"?`,
      () => {
        dispatch({ type: 'DELETE_EXPENSE', payload: expenseId });
      }
    );
  };

  const totalExpenses = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            dispatch({ type: 'SET_SELECTED_EXPENSE_GROUP', payload: null });
            dispatch({ type: 'GO_BACK' });
          }}
          style={styles.backButton}
        >
          <Icon name="back" size={ICON_SIZES.ACTION} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.description && (
            <Text style={styles.groupDescription}>{group.description}</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEditGroup} style={styles.iconButton}>
            <Icon name="edit" size={ICON_SIZES.ACTION} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteGroup} style={styles.iconButton}>
            <Icon name="delete" size={ICON_SIZES.ACTION} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalExpenses)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Members</Text>
            <Text style={styles.summaryValue}>{group.members.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.summaryValue}>{groupExpenses.length}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.tabActive]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.tabTextActive]}>
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'visualizations' && styles.tabActive]}
          onPress={() => setActiveTab('visualizations')}
        >
          <Text style={[styles.tabText, activeTab === 'visualizations' && styles.tabTextActive]}>
            Visualizations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settlements' && styles.tabActive]}
          onPress={() => setActiveTab('settlements')}
        >
          <Text style={[styles.tabText, activeTab === 'settlements' && styles.tabTextActive]}>
            Settlements
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <View style={styles.tabContent}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddExpense}
          >
            <Icon name="add" size={ICON_SIZES.SM} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Expense</Text>
          </TouchableOpacity>

          {groupExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="chart" size={ICON_SIZES.EMPTY_STATE} />
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptyText}>
                Add your first expense to start splitting bills
              </Text>
            </View>
          ) : (
            groupExpenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(expense => {
                const paidByPerson = state.people.find(p => p.id === expense.paidBy);
                const splitAmount = expense.amount / expense.splits.length;
                return (
                  <TouchableOpacity
                    key={expense.id}
                    style={styles.expenseCard}
                    onPress={() => handleExpensePress(expense.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.expenseHeader}>
                      <View style={styles.expenseLeft}>
                        <View style={styles.expenseIconContainer}>
                          <Icon name="expense_arrow" size={ICON_SIZES.SM} />
                        </View>
                        <View style={styles.expenseInfo}>
                          <Text style={styles.expenseDescription}>
                            {expense.description || 'No description'}
                          </Text>
                          <View style={styles.expenseMetaRow}>
                            <View style={styles.metaBadge}>
                              <Icon name="groups" size={10} color="#9ca3af" />
                              <Text style={styles.expenseMeta}>
                                {paidByPerson?.name || 'Unknown'}
                              </Text>
                            </View>
                            <View style={styles.metaBadge}>
                              <Text style={styles.expenseMeta}>
                                📅 {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      <View style={styles.expenseAmountContainer}>
                        <TouchableOpacity
                          style={styles.expenseDeleteButton}
                          onPress={() => handleDeleteExpense(expense.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Icon name="delete" size={ICON_SIZES.SM} color="#ef4444" />
                        </TouchableOpacity>
                        <View>
                          <Text style={styles.expenseAmount}>
                            {formatCurrency(expense.amount)}
                          </Text>
                          <Text style={styles.expensePerPerson}>
                            {formatCurrency(splitAmount)} each
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.expenseSplits}>
                      <View style={styles.splitsList}>
                        {expense.splits.slice(0, 3).map((split, idx) => {
                          const person = state.people.find(p => p.id === split.personId);
                          return (
                            <View key={split.personId} style={styles.splitItem}>
                              <View style={[styles.splitPersonIcon, { backgroundColor: person?.color + '20' }]}>
                                <PersonAvatar icon={person?.icon || 'av0'} size={24} />
                              </View>
                              <Text style={styles.splitPersonName} numberOfLines={1}>
                                {person?.name || 'Unknown'}
                              </Text>
                              <Text style={styles.splitAmount}>
                                {formatCurrency(split.amount)}
                              </Text>
                            </View>
                          );
                        })}
                        {expense.splits.length > 3 && (
                          <Text style={styles.splitMore}>
                            +{expense.splits.length - 3} more
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
          )}
        </View>
      )}

      {/* Visualizations Tab */}
      {activeTab === 'visualizations' && (
        <View style={styles.tabContent}>
          {/* Who Paid Distribution Chart */}
          {balances.filter(b => b.totalPaid > 0).length > 0 && (
            <View style={styles.chartContainer}>
              <View style={styles.distributionChart}>
                <Text style={styles.chartTitle}>Who Paid</Text>
                <View style={styles.totalDisplay}>
                  <Text style={styles.totalLabel}>Total Paid</Text>
                  <Text style={styles.totalAmount}>
                    {formatCurrency(balances.reduce((sum, b) => sum + b.totalPaid, 0))}
                  </Text>
                </View>
                
                {/* Person bars */}
                <View style={styles.categoryBars}>
                  {balances
                    .filter(b => b.totalPaid > 0)
                    .sort((a, b) => b.totalPaid - a.totalPaid)
                    .map(balance => {
                      const person = state.people.find(p => p.id === balance.personId);
                      if (!person) return null;
                      
                      const totalPaid = balances.reduce((sum, b) => sum + b.totalPaid, 0);
                      const percentage = totalPaid > 0 ? (balance.totalPaid / totalPaid) * 100 : 0;

                      return (
                        <TouchableOpacity 
                          key={balance.personId} 
                          style={styles.categoryBar}
                          activeOpacity={0.7}
                        >
                          <View style={styles.categoryBarHeader}>
                            <View style={styles.categoryBarLeft}>
                              <PersonAvatar icon={person.icon} size={24} />
                              <Text style={styles.categoryBarName}>{person.name}</Text>
                            </View>
                            <Text style={styles.categoryBarAmount}>{formatCurrency(balance.totalPaid)}</Text>
                          </View>
                          <View style={styles.categoryBarProgress}>
                            <View 
                              style={[
                                styles.categoryBarFill, 
                                { 
                                  width: `${percentage}%`,
                                  backgroundColor: person.color
                                }
                              ]} 
                            />
                          </View>
                          <Text style={styles.categoryBarPercentage}>{percentage.toFixed(1)}%</Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>
            </View>
          )}

          {/* Who Owes Distribution Chart */}
          {balances.filter(b => b.totalOwed > 0).length > 0 && (
            <View style={styles.chartContainer}>
              <View style={styles.distributionChart}>
                <Text style={styles.chartTitle}>Who Owes</Text>
                <View style={styles.totalDisplay}>
                  <Text style={styles.totalLabel}>Total Owed</Text>
                  <Text style={styles.totalAmount}>
                    {formatCurrency(balances.reduce((sum, b) => sum + b.totalOwed, 0))}
                  </Text>
                </View>
                
                {/* Person bars */}
                <View style={styles.categoryBars}>
                  {balances
                    .filter(b => b.totalOwed > 0)
                    .sort((a, b) => b.totalOwed - a.totalOwed)
                    .map(balance => {
                      const person = state.people.find(p => p.id === balance.personId);
                      if (!person) return null;
                      
                      const totalOwed = balances.reduce((sum, b) => sum + b.totalOwed, 0);
                      const percentage = totalOwed > 0 ? (balance.totalOwed / totalOwed) * 100 : 0;

                      return (
                        <TouchableOpacity 
                          key={balance.personId} 
                          style={styles.categoryBar}
                          activeOpacity={0.7}
                        >
                          <View style={styles.categoryBarHeader}>
                            <View style={styles.categoryBarLeft}>
                              <PersonAvatar icon={person.icon} size={24} />
                              <Text style={styles.categoryBarName}>{person.name}</Text>
                            </View>
                            <Text style={styles.categoryBarAmount}>{formatCurrency(balance.totalOwed)}</Text>
                          </View>
                          <View style={styles.categoryBarProgress}>
                            <View 
                              style={[
                                styles.categoryBarFill, 
                                { 
                                  width: `${percentage}%`,
                                  backgroundColor: person.color
                                }
                              ]} 
                            />
                          </View>
                          <Text style={styles.categoryBarPercentage}>{percentage.toFixed(1)}%</Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>
            </View>
          )}

          {/* Net Balance Distribution Chart */}
          {balances.filter(b => Math.abs(b.netBalance) > 0.01).length > 0 && (
            <View style={styles.chartContainer}>
              <View style={styles.distributionChart}>
                <Text style={styles.chartTitle}>Net Balance</Text>
                
                {/* Person bars */}
                <View style={styles.categoryBars}>
                  {balances
                    .filter(b => Math.abs(b.netBalance) > 0.01)
                    .sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance))
                    .map(balance => {
                      const person = state.people.find(p => p.id === balance.personId);
                      if (!person) return null;
                      
                      const maxBalance = Math.max(...balances.map(b => Math.abs(b.netBalance)), 1);
                      const percentage = (Math.abs(balance.netBalance) / maxBalance) * 100;
                      const isPositive = balance.netBalance > 0;
                      const isNegative = balance.netBalance < 0;

                      return (
                        <TouchableOpacity 
                          key={balance.personId} 
                          style={styles.categoryBar}
                          activeOpacity={0.7}
                        >
                          <View style={styles.categoryBarHeader}>
                            <View style={styles.categoryBarLeft}>
                              <PersonAvatar icon={person.icon} size={24} />
                              <Text style={styles.categoryBarName}>{person.name}</Text>
                            </View>
                            <Text style={[
                              styles.categoryBarAmount,
                              isPositive && styles.categoryBarAmountPositive,
                              isNegative && styles.categoryBarAmountNegative
                            ]}>
                              {isPositive ? '+' : ''}{formatCurrency(balance.netBalance)}
                            </Text>
                          </View>
                          <View style={styles.categoryBarProgress}>
                            <View 
                              style={[
                                styles.categoryBarFill, 
                                { 
                                  width: `${percentage}%`,
                                  backgroundColor: isPositive ? '#10b981' : '#ef4444'
                                }
                              ]} 
                            />
                          </View>
                          <View style={styles.categoryBarFooter}>
                            <Text style={styles.categoryBarPercentage}>{percentage.toFixed(1)}%</Text>
                            <Text style={styles.categoryBarLabel}>
                              {isPositive ? 'Is owed' : isNegative ? 'Owes' : 'Settled'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>
            </View>
          )}

          {/* Empty State */}
          {balances.filter(b => b.totalPaid > 0 || b.totalOwed > 0).length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="chart" size={ICON_SIZES.EMPTY_STATE} />
              <Text style={styles.emptyTitle}>No data to visualize</Text>
              <Text style={styles.emptyText}>
                Add expenses to see payment visualizations
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Settlements Tab */}
      {activeTab === 'settlements' && (
        <View style={styles.tabContent}>
          {remainingDebts.length === 0 && groupExpenses.length > 0 ? (
            <View style={styles.emptyState}>
              <Icon name="success" size={ICON_SIZES.EMPTY_STATE} />
              <Text style={styles.emptyTitle}>All settled!</Text>
              <Text style={styles.emptyText}>
                No outstanding balances in this group
              </Text>
            </View>
          ) : remainingDebts.length === 0 && groupExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="chart" size={ICON_SIZES.EMPTY_STATE} />
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptyText}>
                Add expenses to see settlements
              </Text>
            </View>
          ) : (
            <>
              {/* Who owes whom - remaining only */}
              <View style={styles.whoOwesSection}>
                <Text style={styles.whoOwesTitle}>Who owes whom</Text>
                <Text style={styles.whoOwesSubtitle}>
                  Remaining payments needed:
                </Text>
                {(() => {
                  const debtsByFrom = remainingDebts.reduce<Record<string, Array<{ to: string; amount: number }>>>((acc, d) => {
                    if (!acc[d.from]) acc[d.from] = [];
                    acc[d.from].push({ to: d.to, amount: d.amount });
                    return acc;
                  }, {});
                  return Object.entries(debtsByFrom).map(([fromId, toList]) => {
                    const fromPerson = state.people.find(p => p.id === fromId);
                    return (
                      <View key={fromId} style={styles.whoOwesRow}>
                        <View style={styles.whoOwesPersonRow}>
                          <View style={[styles.whoOwesAvatar, { backgroundColor: (fromPerson?.color || '#6b7280') + '30' }]}>
                            <PersonAvatar icon={fromPerson?.icon || 'av0'} size={20} />
                          </View>
                          <Text style={styles.whoOwesPersonName}>{fromPerson?.name || 'Unknown'} owes</Text>
                        </View>
                        {toList.map(({ to, amount }) => {
                          const toPerson = state.people.find(p => p.id === to);
                          return (
                            <View key={to} style={styles.whoOwesDebtRow}>
                              <Text style={styles.whoOwesToName}>→ {toPerson?.name || 'Unknown'}</Text>
                              <Text style={styles.whoOwesAmount}>{formatCurrency(amount)}</Text>
                            </View>
                          );
                        })}
                      </View>
                    );
                  });
                })()}
              </View>

              {/* Remaining debt cards - tap to settle (full or partial) */}
              {remainingDebts.map((debt, index) => {
                const fromPerson = state.people.find(p => p.id === debt.from);
                const toPerson = state.people.find(p => p.id === debt.to);
                return (
                  <View key={`${debt.from}-${debt.to}-${index}`} style={styles.debtCard}>
                    <View style={styles.debtHeader}>
                      <View style={styles.debtLeft}>
                        <View style={[styles.personIcon, { backgroundColor: fromPerson?.color + '20' }]}>
                          <PersonAvatar icon={fromPerson?.icon || 'av0'} size={40} />
                        </View>
                        <View style={styles.debtInfo}>
                          <Text style={styles.debtText}>
                            <Text style={styles.debtFrom}>{fromPerson?.name || 'Unknown'}</Text>
                            {' owes '}
                            <Text style={styles.debtTo}>{toPerson?.name || 'Unknown'}</Text>
                          </Text>
                          <Text style={styles.debtAmount}>
                            {formatCurrency(debt.amount)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.settleButton}
                      onPress={() => {
                        setDebtToSettle(debt);
                        setSettleModalVisible(true);
                      }}
                    >
                      <Icon name="success" size={ICON_SIZES.SM} color="#ffffff" />
                      <Text style={styles.settleButtonText}>Settle payment</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Settlements made (below pending) */}
              {(() => {
                const groupSettlements = state.settlements
                  .filter(s => s.groupId === group.id && s.settled)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                if (groupSettlements.length === 0) return null;
                return (
                  <View style={styles.pastSettlementsSection}>
                    <Text style={styles.whoOwesTitle}>Settlements made</Text>
                    {groupSettlements.map(s => {
                      const fromPerson = state.people.find(p => p.id === s.from);
                      const toPerson = state.people.find(p => p.id === s.to);
                      return (
                        <View key={s.id} style={styles.pastSettlementRow}>
                          <Text style={styles.pastSettlementText}>
                            {fromPerson?.name || 'Unknown'} → {toPerson?.name || 'Unknown'}: {formatCurrency(s.amount)}
                          </Text>
                          <Text style={styles.pastSettlementDate}>
                            {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })()}
            </>
          )}
        </View>
      )}

      {/* Partial settlement amount modal */}
      <CustomInputModal
        visible={settleModalVisible}
        title="Settle payment"
        message={debtToSettle ? `How much is being settled? (max ${formatCurrency(debtToSettle.amount)})` : ''}
        placeholder="Amount"
        keyboardType="decimal-pad"
        initialValue={debtToSettle ? debtToSettle.amount.toString() : ''}
        onConfirm={(value) => {
          if (!debtToSettle) return;
          const amount = parseFloat(value.replace(/,/g, '.')) || 0;
          handleSettleDebt(debtToSettle, amount);
        }}
        onCancel={() => {
          setSettleModalVisible(false);
          setDebtToSettle(null);
        }}
      />

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 50,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  groupDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  summaryCard: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#ec9706',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabContent: {
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec9706',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  expenseCard: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#ec9706',
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  expenseLeft: {
    flex: 1,
    marginRight: 12,
    flexDirection: 'row',
    gap: 12,
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef444420',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  expenseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  expenseMeta: {
    fontSize: 11,
    color: '#9ca3af',
  },
  expenseAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  expenseDeleteButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  expensePerPerson: {
    fontSize: 11,
    color: '#9ca3af',
  },
  expenseSplits: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  splitsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  splitsList: {
    gap: 6,
  },
  splitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  splitPersonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitPersonName: {
    flex: 1,
    fontSize: 12,
    color: '#ffffff',
  },
  splitAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  splitMore: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Visualization styles (matching Reports.tsx style)
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  distributionChart: {
    backgroundColor: '#202020ff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  totalDisplay: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#333333',
  },
  totalLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  categoryBars: {
    marginTop: 8,
  },
  categoryBar: {
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  categoryBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  categoryBarName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 12,
  },
  categoryBarAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  categoryBarAmountPositive: {
    color: '#10b981',
  },
  categoryBarAmountNegative: {
    color: '#ef4444',
  },
  categoryBarProgress: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryBarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBarPercentage: {
    fontSize: 12,
    color: '#9ca3af',
  },
  categoryBarLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  whoOwesSection: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ec9706',
  },
  whoOwesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  whoOwesSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 16,
  },
  whoOwesRow: {
    marginBottom: 14,
  },
  whoOwesPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  whoOwesAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whoOwesPersonName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  whoOwesDebtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 36,
    paddingVertical: 4,
  },
  whoOwesToName: {
    fontSize: 14,
    color: '#d1d5db',
  },
  whoOwesAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ec9706',
  },
  pastSettlementsSection: {
    backgroundColor: '#1a2e1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  pastSettlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  pastSettlementText: {
    fontSize: 14,
    color: '#d1d5db',
    flex: 1,
  },
  pastSettlementDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
  },
  debtCard: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  debtCardSettled: {
    opacity: 0.6,
    backgroundColor: '#1a1a1a',
  },
  debtHeader: {
    marginBottom: 12,
  },
  debtLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  personIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtInfo: {
    flex: 1,
  },
  debtText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  debtFrom: {
    fontWeight: '600',
    color: '#ef4444',
  },
  debtTo: {
    fontWeight: '600',
    color: '#10b981',
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  settleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  settleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b98120',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  settledBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
