import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowUpDown, Search, SlidersHorizontal, X } from 'lucide-react-native';

import { Filters, countActiveFilters } from '../components/Filters';
import { OrderList } from '../components/OrderList';
import { SortSheet } from '../components/SortSheet';
import type { AllocationWorkspace } from '../hooks/useAllocationWorkspace';
import { theme } from '../theme';

interface Props {
  workspace: AllocationWorkspace;
}

type ActionVariant = 'primary' | 'secondary' | 'success';

const FILTER_HIDE_OFFSET = 24;
const FILTER_SCROLL_DELTA = 8;
const FILTER_BOTTOM_GUARD_OFFSET = 56;

const ACTION_COLORS: Record<
  ActionVariant,
  { background: string; text: string }
> = {
  primary: {
    background: theme.colors.action.primary,
    text: theme.colors.text.inverse,
  },
  secondary: {
    background: theme.colors.action.secondary,
    text: theme.colors.text.primary,
  },
  success: {
    background: theme.colors.action.success,
    text: theme.colors.text.inverse,
  },
};

function ActionButton({
  label,
  variant = 'primary',
  disabled = false,
  onPress,
}: {
  label: string;
  variant?: ActionVariant;
  disabled?: boolean;
  onPress: () => void;
}) {
  const colors = ACTION_COLORS[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionButton,
        { backgroundColor: colors.background },
        disabled ? styles.actionButtonDisabled : null,
      ]}
    >
      <Text style={[styles.actionButtonText, { color: colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function getBusyMessage(action: string | null) {
  switch (action) {
    case 're-auto-allocate':
      return 'Re-running allocation';
    case 'reset-sample':
      return 'Resetting sample data';
    case 'generate-1000':
      return 'Generating 1,000 orders';
    case 'generate-5000':
      return 'Generating 5,000 orders';
    case 'generate-10000':
      return 'Generating 10,000 orders';
    default:
      return 'Updating orders';
  }
}

export function OrdersScreen({ workspace }: Props) {
  const {
    filter,
    customerOptions,
    warehouseOptions,
    supplierOptions,
    filteredOrderCount,
    totalOrderCount,
    filteredOrders,
    result,
    busy,
    busyAction,
    orderSortDirection,
    handleFilterChange,
    handleOrderSortChange,
    handleManualChange,
    handleReAutoAllocate,
    handleResetSample,
    handleGenerate,
  } = workspace;

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const activeCount = countActiveFilters(filter);
  const filterVisibility = useRef(new Animated.Value(0)).current;
  const filterHiddenRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const [filterSectionHeight, setFilterSectionHeight] = useState(0);
  const [filterHiddenByScroll, setFilterHiddenByScroll] = useState(false);

  const setFilterHidden = useCallback(
    (hidden: boolean) => {
      if (filterHiddenRef.current === hidden) return;

      filterHiddenRef.current = hidden;
      setFilterHiddenByScroll(hidden);
      Animated.timing(filterVisibility, {
        toValue: hidden ? 1 : 0,
        duration: 170,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [filterVisibility],
  );

  const handleFilterLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setFilterSectionHeight(currentHeight =>
      currentHeight === nextHeight ? currentHeight : nextHeight,
    );
  }, []);

  const handleOrderListScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const currentY = Math.max(0, contentOffset.y);
      const delta = currentY - lastScrollYRef.current;
      const hideOffset = Math.max(FILTER_HIDE_OFFSET, filterSectionHeight);
      const maxScrollY = Math.max(
        0,
        contentSize.height - layoutMeasurement.height,
      );
      const distanceFromBottom = Math.max(0, maxScrollY - currentY);
      const nearBottom =
        maxScrollY > 0 && distanceFromBottom <= FILTER_BOTTOM_GUARD_OFFSET;

      if (currentY <= hideOffset) {
        setFilterHidden(false);
        lastScrollYRef.current = currentY;
        return;
      }

      if (nearBottom && delta < -FILTER_SCROLL_DELTA) {
        lastScrollYRef.current = currentY;
        return;
      }

      if (delta > FILTER_SCROLL_DELTA) {
        setFilterHidden(true);
        lastScrollYRef.current = currentY;
      } else if (delta < -FILTER_SCROLL_DELTA) {
        setFilterHidden(false);
        lastScrollYRef.current = currentY;
      }
    },
    [filterSectionHeight, setFilterHidden],
  );

  const filterTranslateY = filterVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(filterSectionHeight + 1)],
  });

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.navigationHeader}>
        <Text style={styles.headerTitle}>Orders</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionScroller}
        >
          <ActionButton
            label="Re-run auto-allocate"
            disabled={busy}
            onPress={handleReAutoAllocate}
          />
          <ActionButton
            label="Reset sample"
            variant="secondary"
            disabled={busy}
            onPress={handleResetSample}
          />
          <ActionButton
            label="Generate 1,000"
            variant="success"
            disabled={busy}
            onPress={() => handleGenerate(1000)}
          />
          <ActionButton
            label="Generate 5,000"
            variant="success"
            disabled={busy}
            onPress={() => handleGenerate(5000)}
          />
          <ActionButton
            label="Generate 10,000"
            variant="success"
            disabled={busy}
            onPress={() => handleGenerate(10000)}
          />
        </ScrollView>
      </View>

      <View style={styles.contentArea}>
        {busy ? (
          <View
            style={[
              styles.bodyLoading,
              filterSectionHeight
                ? { paddingTop: filterSectionHeight + 32 }
                : null,
            ]}
          >
            <ActivityIndicator size="large" color={theme.colors.text.primary} />
            <Text style={styles.bodyLoadingTitle}>
              {getBusyMessage(busyAction)}
            </Text>
            <Text style={styles.bodyLoadingText}>Please wait...</Text>
          </View>
        ) : (
          <OrderList
            orders={filteredOrders}
            allocations={result.allocations}
            onChange={handleManualChange}
            onScroll={handleOrderListScroll}
            contentTopInset={filterSectionHeight ? filterSectionHeight + 20 : 0}
          />
        )}

        <Animated.View
          pointerEvents={filterHiddenByScroll ? 'none' : 'auto'}
          style={[
            styles.filterOverlay,
            {
              transform: [{ translateY: filterTranslateY }],
            },
          ]}
        >
          <View onLayout={handleFilterLayout} style={styles.filterPanel}>
            <Text style={styles.filterCountText}>
              {filteredOrderCount.toLocaleString()} of{' '}
              {totalOrderCount.toLocaleString()}
            </Text>
            <View style={styles.searchFilterRow}>
              <View style={styles.searchControl}>
                <Search size={22} color={theme.colors.text.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search orders"
                  placeholderTextColor={theme.colors.text.placeholder}
                  value={filter.search}
                  onChangeText={search =>
                    handleFilterChange({ ...filter, search })
                  }
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                />
                {filter.search.trim() ? (
                  <Pressable
                    onPress={() =>
                      handleFilterChange({ ...filter, search: '' })
                    }
                    hitSlop={10}
                  >
                    <X size={16} color={theme.colors.text.muted} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                onPress={() => setFiltersOpen(true)}
                style={styles.filterButton}
              >
                <SlidersHorizontal
                  size={18}
                  color={theme.colors.text.primary}
                />
                <Text style={styles.filterButtonText}>Filters</Text>
                {activeCount > 0 ? (
                  <View style={styles.activeCountBadge}>
                    <Text style={styles.activeCountText}>{activeCount}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => setSortOpen(true)}
                style={styles.sortButton}
              >
                <ArrowUpDown size={18} color={theme.colors.text.primary} />
                <Text style={styles.filterButtonText}>Sort</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>

      <Filters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filter}
        onChange={handleFilterChange}
        customerOptions={customerOptions}
        warehouseOptions={warehouseOptions}
        supplierOptions={supplierOptions}
        matchCount={filteredOrderCount}
        totalCount={totalOrderCount}
      />
      <SortSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        value={orderSortDirection}
        onChange={handleOrderSortChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
  },
  actionButton: {
    height: 45,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: theme.colors.action.disabledOpacity,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionScroller: {
    paddingTop: 8,
  },
  navigationHeader: {
    zIndex: 20,
    elevation: 0,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: theme.colors.background.surface,
    shadowColor: theme.colors.transparent,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  contentArea: {
    flex: 1,
    overflow: 'hidden',
  },
  bodyLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  bodyLoadingTitle: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },
  bodyLoadingText: {
    color: theme.colors.text.muted,
    fontSize: 12,
    marginTop: 4,
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    backgroundColor: theme.colors.background.surface,
  },
  filterPanel: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: theme.colors.background.surface,
  },
  filterCountText: {
    color: theme.colors.text.muted,
    fontSize: 12,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  searchControl: {
    height: 45,
    minHeight: 45,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.strong,
    backgroundColor: theme.colors.background.surface,
  },
  searchInput: {
    flex: 1,
    height: 45,
    marginLeft: 10,
    paddingVertical: 0,
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  filterButton: {
    height: 45,
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.strong,
    backgroundColor: theme.colors.background.surface,
  },
  sortButton: {
    height: 45,
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.strong,
    backgroundColor: theme.colors.background.surface,
  },
  filterButtonText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  activeCountBadge: {
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.action.primary,
  },
  activeCountText: {
    color: theme.colors.text.inverse,
    fontSize: 10,
    fontWeight: '800',
  },
});
