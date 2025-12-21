import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Icon } from './ui/Icon';
import { ICON_SIZES } from '../constants/iconSizes';
import { getGroupTotalExpenses, calculateBalances, calculateSimplifiedDebts } from '../utils/dividoUtils';
import { SideMenu } from './SideMenu';

export function Divido() {
  const { state, dispatch, formatCurrency } = useApp();
  const [showSideMenu, setShowSideMenu] = useState(false);

  const handleAddGroup = () => {
    dispatch({ type: 'SET_SCREEN', payload: 'add-expense-group' });
  };

  const handleGroupPress = (groupId: string) => {
    dispatch({ 
      type: 'SET_SELECTED_EXPENSE_GROUP', 
      payload: groupId 
    });
    dispatch({ 
      type: 'SET_SCREEN', 
      payload: 'expense-group-detail' 
    });
  };

  // Calculate total stats
  const totalGroups = state.expenseGroups.length;
  const totalPeople = state.people.length;
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate total you owe and are owed across all groups
  let totalOwed = 0;
  let totalOwing = 0;

  state.expenseGroups.forEach(group => {
    const balances = calculateBalances(group, state.expenses, state.people);
    balances.forEach(balance => {
      if (balance.netBalance < 0) {
        totalOwing += Math.abs(balance.netBalance);
      } else if (balance.netBalance > 0) {
        totalOwed += balance.netBalance;
      }
    });
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowSideMenu(true)}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image
              source={require('../../assets/icons/divido/divido.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Divido</Text>
          </View>
          <View style={styles.menuButton} />
        </View>

      {/* Side Menu */}
      <SideMenu 
        visible={showSideMenu}
        onClose={() => setShowSideMenu(false)}
      />

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Groups</Text>
          <Text style={styles.statValue}>{totalGroups}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>People</Text>
          <Text style={styles.statValue}>{totalPeople}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Expenses</Text>
          <Text style={styles.statValue}>{formatCurrency(totalExpenses)}</Text>
        </View>
      </View>

      {/* Balance Summary */}
      {(totalOwing > 0 || totalOwed > 0) && (
        <View style={styles.balanceSummary}>
          <Text style={styles.balanceTitle}>Your Balance</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>You owe</Text>
              <Text style={[styles.balanceAmount, styles.negativeAmount]}>
                {formatCurrency(totalOwing)}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>You are owed</Text>
              <Text style={[styles.balanceAmount, styles.positiveAmount]}>
                {formatCurrency(totalOwed)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Groups List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expense Groups</Text>
        {state.expenseGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="groups" size={ICON_SIZES.EMPTY_STATE} />
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptyText}>
              Create your first expense group to start splitting bills
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleAddGroup}
            >
              <Icon name="add" size={ICON_SIZES.SM} />
              <Text style={styles.emptyButtonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          state.expenseGroups.map(group => {
            const groupExpenses = state.expenses.filter(e => e.groupId === group.id);
            const totalGroupExpenses = getGroupTotalExpenses(group.id, state.expenses);
            const balances = calculateBalances(group, state.expenses, state.people);
            const debts = calculateSimplifiedDebts(balances);
            const isSettled = debts.length === 0 && groupExpenses.length > 0;
            
            return (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => handleGroupPress(group.id)}
                activeOpacity={0.7}
              >
                <View style={styles.groupCardHeader}>
                  <View style={styles.groupCardLeft}>
                    <View style={[styles.groupIconContainer, isSettled && styles.groupIconSettled]}>
                      <Icon name="groups" size={ICON_SIZES.SM} />
                    </View>
                    <View style={styles.groupInfo}>
                      <View style={styles.groupNameRow}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        {isSettled && (
                          <View style={styles.settledBadge}>
                            <Icon name="success" size={12} />
                            <Text style={styles.settledText}>Settled</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.groupMetaRow}>
                        <View style={styles.metaItem}>
                          <Icon name="groups" size={12} color="#9ca3af" />
                          <Text style={styles.metaText}>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Icon name="expense_arrow" size={12} color="#9ca3af" />
                          <Text style={styles.metaText}>{groupExpenses.length} expense{groupExpenses.length !== 1 ? 's' : ''}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.groupCardRight}>
                    <View style={styles.totalContainer}>
                      <Text style={styles.groupTotal}>{formatCurrency(totalGroupExpenses)}</Text>
                      {groupExpenses.length > 0 && (
                        <View style={styles.expenseIndicator}>
                          <View style={[styles.expenseDot, { backgroundColor: isSettled ? '#10b981' : '#ec9706' }]} />
                          <Text style={styles.expenseCount}>{groupExpenses.length}</Text>
                        </View>
                      )}
                    </View>
                    <Icon name="forward" size={ICON_SIZES.SM} color="#ffffff" />
                  </View>
                </View>
                
                {/* Visual Expense Bar */}
                {groupExpenses.length > 0 && (
                  <View style={styles.expenseBarContainer}>
                    <View style={styles.expenseBar}>
                      {groupExpenses.slice(0, 5).map((expense, idx) => (
                        <View 
                          key={expense.id} 
                          style={[
                            styles.expenseBarSegment,
                            { 
                              width: `${100 / Math.min(groupExpenses.length, 5)}%`,
                              backgroundColor: isSettled ? '#10b981' : '#ec9706'
                            }
                          ]} 
                        />
                      ))}
                      {groupExpenses.length > 5 && (
                        <View style={[styles.expenseBarSegment, styles.expenseBarMore]}>
                          <Text style={styles.expenseBarMoreText}>+{groupExpenses.length - 5}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
                
                {debts.length > 0 && (
                  <View style={styles.groupDebts}>
                    <View style={styles.debtsHeader}>
                      <Icon name="expense_arrow" size={14} color="#ef4444" />
                      <Text style={styles.debtsLabel}>Settlements needed</Text>
                    </View>
                    <Text style={styles.debtsText} numberOfLines={2}>
                      {debts.slice(0, 2).map((debt, idx) => {
                        const fromPerson = state.people.find(p => p.id === debt.from);
                        const toPerson = state.people.find(p => p.id === debt.to);
                        return `${fromPerson?.name || 'Unknown'} → ${toPerson?.name || 'Unknown'} ${formatCurrency(debt.amount)}`;
                      }).join(' • ')}
                      {debts.length > 2 && ` • +${debts.length - 2} more`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>

    {/* Floating Add Group Button */}
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={handleAddGroup}
    >
      <Icon name="add" size={ICON_SIZES.FLOATING} color="#ffffff" />
    </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  menuButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ec9706',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  balanceSummary: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 16,
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#10b981',
  },
  negativeAmount: {
    color: '#ef4444',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  groupCard: {
    backgroundColor: '#202020ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ec9706',
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  groupIconSettled: {
    backgroundColor: '#10b98120',
  },
  groupInfo: {
    flex: 1,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  settledText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
  },
  groupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  groupCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  groupTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  expenseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  expenseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  expenseCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  expenseBarContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  expenseBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  expenseBarSegment: {
    height: '100%',
  },
  expenseBarMore: {
    backgroundColor: '#ec9706',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
  },
  expenseBarMoreText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#ffffff',
  },
  groupDebts: {
    marginTop: 12,
    paddingTop: 12,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#ef4444',
    backgroundColor: '#ef444410',
    borderRadius: 6,
    padding: 10,
  },
  debtsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  debtsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  debtsText: {
    fontSize: 12,
    color: '#ffffff',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
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
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ec9706',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
